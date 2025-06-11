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
                    
                    VStack(alignment: .leading) {
                        if (entry.danger == .journaledTwoDaysAgo) {
                            Text("Save your\nstreak!")
                                .font(Font.custom("Lato", size: 22))
                                .padding(.bottom, 2)
                        } else if (entry.danger == .noRecovery) {
                            Text("What's\nhappening?")
                                .font(Font.custom("Lato", size: 22))
                                .padding(.bottom, 2)
                        } else {
                            Text("\(entry.streak) day\nstreak")
                        }
                    }.font(Font.custom("Lato", size: 24))
                        .fontWeight(.bold)
                        .lineLimit(2)
                        .environment(\._lineHeightMultiple, 0.9)
                        .minimumScaleFactor(0.5)
                }
                Spacer()
            }.padding(.top, 18).padding(.horizontal, 16).padding(.bottom, 11)
        }
    }
}

#Preview(as: .systemSmall) {
    StreakWidget()
} timeline: {
    Entry(date: Date(), streak: 66, danger: .journaledToday, error: false, entriesToday: 1)
    Entry(date: Date(), streak: 25, danger: .journaledYesterday, error: false, entriesToday: 0)
    Entry(date: Date(), streak: 0, danger: .noRecovery, error: false, entriesToday: 0)
    Entry(date: Date(), streak: 25, danger: .journaledTwoDaysAgo, error: false, entriesToday: 0)
    Entry.errorEntry()
}

