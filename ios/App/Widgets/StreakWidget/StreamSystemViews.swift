//
//  StreamSystemViews.swift
//  App
//
//  Created by Nisala on 2/24/25.
//

import SwiftUI
import WidgetKit

struct StreakSystemWidget: View {
    var entry: Entry
    
    var body: some View {
        if let mapping = dangerMapping[entry.danger] {
            HStack(alignment: .top) {
                VStack(alignment: .leading) {
                    Image(systemName: mapping.icon)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 40, height: 40)
                        .foregroundColor(mapping.color)
                    Spacer()
                    
                    VStack(alignment: .leading, spacing: -3) {
                        if (entry.danger == .journaledTwoDaysAgo) {
                            Text("Save your")
                            Text("streak!")
                        } else if (entry.danger == .noRecovery) {
                            Group {
                                Text("What's")
                                Text("happening?")
                            }.font(Font.custom("Lato", size: 22))
                        } else {
                            Text("\(entry.streak) day")
                            Text("streak")
                        }
                    }.font(Font.custom("Lato", size: 24))
                        .fontWeight(.bold)
                }
                Spacer()
            }
        }
    }
}

#Preview(as: .systemSmall) {
    StreakWidget()
} timeline: {
    Entry(date: Date(), streak: 25, danger: .journaledToday, error: false, entriesToday: 1)
    Entry(date: Date(), streak: 25, danger: .journaledYesterday, error: false, entriesToday: 0)
    Entry(date: Date(), streak: 0, danger: .noRecovery, error: false, entriesToday: 0)
    Entry(date: Date(), streak: 25, danger: .journaledTwoDaysAgo, error: false, entriesToday: 0)
}

