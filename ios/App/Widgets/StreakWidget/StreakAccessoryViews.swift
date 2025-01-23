//
//  StreakAccessoryViews.swift
//  App
//
//  Created by Nisala on 1/24/25.
//

import SwiftUI
import WidgetKit

func getIconFromEntry(entry: Entry) -> String {
    switch entry.danger {
        case .journaledToday: return "flame.fill"
        case .journaledYesterday, .noRecovery: return "pencil.tip.crop.circle.fill"
        case .journaledTwoDaysAgo: return "exclamationmark.triangle.fill"
    }
}

struct StreakCircularAccessory: View {
    var entry: Entry
    
    var body: some View {
        Image(systemName: getIconFromEntry(entry: entry)).imageScale(.small)
        Text("\(entry.streak)").fontWeight(.bold).font(.title)
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
        Text("\(entry.streak) day streak")
    }
}

#Preview(as: .accessoryInline) {
    StreakWidget()
} timeline: {
    Entry(date: Date(), streak: 125, danger: .journaledToday, error: false, entriesToday: 1)
}
