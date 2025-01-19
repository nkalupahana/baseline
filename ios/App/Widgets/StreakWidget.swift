//
//  StreakWidget.swift
//  StreakWidget
//
//  Created by Nisala on 1/14/25.
//

import SwiftUI
import WidgetKit

enum Danger: Int, Decodable {
    case journaledToday = 0
    case journaledYesterday = 1
    case journaledTwoDaysAgo = 2
    case noRecovery = 3
}

struct TokenResponse: Decodable {
    let id_token: String
}

struct StreakResponse: Decodable {
    let streak: Int
    let danger: Danger
}

struct Entry: TimelineEntry {
    let date: Date
    let streak: Int
    let danger: Danger
    let error: Bool

    static func errorEntry() -> Entry {
        return Entry(date: Date(), streak: 0, danger: .noRecovery, error: true)
    }
}

struct Provider: TimelineProvider {
    let userDefaults = UserDefaults.init(suiteName: "group.app.getbaseline.baseline")!

    func getAPIKey() -> String? {
        if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") {
            if let plistContent = NSDictionary(contentsOfFile: path) as? [String: Any] {
                return plistContent["API_KEY"] as? String
            }
        }
        return nil
    }

    func getIdToken(completion: @escaping (Result<TokenResponse, Error>) -> Void) {
        guard let apiKey = getAPIKey() else {
            completion(.failure(NSError(domain: "NoApiKey", code: -4)))
            return
        }

        let url = URL(string: "https://securetoken.googleapis.com/v1/token?key=\(apiKey)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

        guard let refreshToken = userDefaults.string(forKey: "refreshToken") else {
            completion(.failure(NSError(domain: "NoData", code: -3)))
            return
        }

        let bodyData = "grant_type=refresh_token&refresh_token=\(refreshToken)"
        request.httpBody = bodyData.data(using: .utf8)

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let data = data else {
                completion(.failure(NSError(domain: "NoData", code: -2)))
                return
            }

            do {
                let response = try JSONDecoder().decode(TokenResponse.self, from: data)
                completion(.success(response))
            } catch {
                completion(.failure(NSError(domain: "Error decoding response: \(error)", code: -1)))
                return
            }
        }

        task.resume()
    }

    func getISODate() -> String {
        let currentDate = Date()
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone.current
        let isoDateString = dateFormatter.string(from: currentDate)

        return isoDateString
    }

    func postStreakRequest(idToken: String, completion: @escaping (Result<StreakResponse, Error>) -> Void) {
        var request = URLRequest(url: URL(string: "https://api.getbaseline.app/streak")!)
        request.httpMethod = "POST"

        // Add the Authorization header
        request.setValue("Bearer \(idToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        guard let keys = userDefaults.string(forKey: "keys") else {
            completion(.failure(NSError(domain: "NoKeys", code: -14)))
            return
        }

        let body: [String: String] = [
            "currentDate": getISODate(),
            "keys": keys,
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            completion(.failure(NSError(domain: "JSON serialization error: \(error)", code: -13)))
            return
        }

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(NSError(domain: "Error making POST request: \(error)", code: -12)))
                return
            }

            if let data = data {
                do {
                    let response = try JSONDecoder().decode(StreakResponse.self, from: data)
                    completion(.success(response))
                } catch {
                    completion(.failure(NSError(domain: "Error decoding response: \(error)", code: -11)))
                    return
                }
            }
        }

        task.resume()
    }

    func placeholder(in context: Context) -> Entry {
        Entry(date: Date(), streak: 25, danger: Danger.journaledToday, error: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
        print("GETTING DATA")
        if context.isPreview {
            completion(placeholder(in: context))
        } else {
            getIdToken { result in
                switch result {
                case .success(let response):
                    postStreakRequest(idToken: response.id_token) { result in
                        switch result {
                        case .success(let response):
                            completion(
                                Entry(date: Date(), streak: response.streak, danger: response.danger, error: false))
                        case .failure(let error):
                            print(error)
                            completion(Entry.errorEntry())
                        }

                    }
                case .failure(let error):
                    print(error)
                    completion(Entry.errorEntry())
                }
            }
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        var entries: [Entry] = []
        let currentDate = Date()
        let refreshDate = Calendar.current.date(byAdding: .minute, value: 30, to: currentDate)!
        getSnapshot(in: context) { entry in
            entries.append(entry)
            let timeline = Timeline(entries: entries, policy: .after(refreshDate))
            completion(timeline)
        }
    }
}

struct StreakWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        VStack {
            Text("Time:")
            Text(entry.date, style: .time)

            Text("Streak:")
            Text("\(entry.streak) (\(entry.danger))")
        }
    }
}

struct StreakWidget: Widget {
    let kind: String = "StreakWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                StreakWidgetEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                StreakWidgetEntryView(entry: entry)
                    .padding()
                    .background()
            }
        }
        .configurationDisplayName("My Widget")
        .description("This is an example widget.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

#Preview(as: .systemSmall) {
    StreakWidget()
} timeline: {
    Entry(date: Date(), streak: 25, danger: .noRecovery, error: false)
}

