//
//  StreakWidget.swift
//  StreakWidget
//
//  Created by Nisala on 1/14/25.
//

import WidgetKit
import SwiftUI


struct Provider: TimelineProvider {
    func refreshToken(completion: @escaping (Result<String, Error>) -> Void) {
        let url = URL(string: "https://securetoken.googleapis.com/v1/token?key=AIzaSyCtzcuoGrYQfj-PaXGLNTD22Ro0JecPLl4")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

        
        let userDefaults = UserDefaults.init(suiteName: "group.app.getbaseline.baseline")!
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
            
            if let result = String(data: data, encoding: .utf8) {
                completion(.success(result))
            } else {
                completion(.failure(NSError(domain: "InvalidData", code: -1)))
            }
        }

        task.resume()
    }
    
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), emoji: "😀")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), emoji: "😀")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [SimpleEntry] = []
        let currentDate = Date()
        let entryDate = Calendar.current.date(byAdding: .hour, value: 0, to: currentDate)!
        let entry = SimpleEntry(date: entryDate, emoji: "😀")
        entries.append(entry)
        
        let timeline = Timeline(entries: entries, policy: .atEnd)
        
        refreshToken { result in
            switch result {
            case .success(let response):
                print("Success: \(response)")
                completion(timeline)
            case .failure(let error):
                print("Error: \(error)")
                completion(timeline)
            }
        }
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let emoji: String
}

struct StreakWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack {
            Text("Time:")
            Text(entry.date, style: .time)

            Text("Emoji:")
            Text(entry.emoji)
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
    SimpleEntry(date: .now, emoji: "😀")
    SimpleEntry(date: .now, emoji: "🤩")
}

