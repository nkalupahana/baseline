//
//  StreakAccessoryViews.swift
//  StreakWidget
//
//  Created by Nisala on 1/24/25.
//

import SwiftUI
import WidgetKit

struct StreakCircularAccessory: View {
    var entry: Entry
    
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack {
                if (entry.error) {
                    Image(systemName: "pencil.tip.crop.circle.fill").imageScale(.medium)
                } else {
                    HStack(spacing: 0) {
                        if let mapping = dangerMapping[entry.danger] {
                            ForEach(0..<mapping.count, id: \ .self) { _ in
                                Image(systemName: mapping.icon).imageScale(.small)
                            }
                        }
                    }
                    Text("\(entry.streak)").fontWeight(.bold).font(.title)
                }
            }
        }
    }
}

#Preview(as: .accessoryCircular) {
    StreakWidget()
} timeline: {
    Entry(date: Date(), streak: 25, danger: .journaledToday, error: false, entriesToday: 1)
    Entry(date: Date(), streak: 25, danger: .journaledYesterday, error: false, entriesToday: 0)
    Entry(date: Date(), streak: 25, danger: .journaledTwoDaysAgo, error: false, entriesToday: 0)
    Entry(date: Date(), streak: 0, danger: .noRecovery, error: false, entriesToday: 0)
}

struct StreakInlineAccessory: View {
    var entry: Entry
    
    var body: some View {
        Image(systemName: dangerMapping[entry.danger]!.icon).imageScale(.small)
        if (!entry.error) {
            if (entry.danger == .journaledTwoDaysAgo) {
                Text("Save your streak!")
            } else {
                Text("\(entry.streak) day streak")
            }
        } else {
            Text("What's happening?")
        }
    }
}

#Preview(as: .accessoryInline) {
    StreakWidget()
} timeline: {
    Entry(date: Date(), streak: 125, danger: .journaledToday, error: false, entriesToday: 1)
    Entry(date: Date(), streak: 125, danger: .journaledYesterday, error: false, entriesToday: 0)
    Entry(date: Date(), streak: 125, danger: .journaledTwoDaysAgo, error: false, entriesToday: 0)
}
