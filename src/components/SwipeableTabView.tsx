import React, { useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import PagerView, { PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabConfig = {
  key: string;
  title: string;
  emoji: string;
  component: React.ComponentType;
  showHeader?: boolean;
};

type SwipeableTabViewProps = {
  tabs: TabConfig[];
  initialIndex?: number;
};

type HeaderProps = {
  title: string;
};

function Header({ title }: HeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

export function SwipeableTabView({ tabs, initialIndex = 0 }: SwipeableTabViewProps) {
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<PagerView>(null);
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  const onPageSelected = useCallback((e: PagerViewOnPageSelectedEvent) => {
    setCurrentIndex(e.nativeEvent.position);
  }, []);

  const onTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    setCurrentIndex(index);
  }, []);

  return (
    <View style={styles.container}>
      {/* Screen Content */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialIndex}
        onPageSelected={onPageSelected}
        overdrag={true}
      >
        {tabs.map((tab) => {
          const TabComponent = tab.component;
          const showHeader = tab.showHeader !== false && tab.key !== 'camera';

          return (
            <View key={tab.key} style={styles.page}>
              {showHeader && <Header title={tab.title} />}
              <TabComponent />
            </View>
          );
        })}
      </PagerView>

      {/* Custom Tab Bar */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom || 8 }]}>
        {tabs.map((tab, index) => {
          const isFocused = currentIndex === index;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => onTabPress(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.tabEmoji}>{tab.emoji}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  isFocused && styles.tabLabelFocused,
                ]}
                numberOfLines={1}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  header: {
    backgroundColor: '#AA4A44',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabEmoji: {
    fontSize: 24,
  },
  tabLabel: {
    fontSize: 9,
    color: '#6b7280',
    fontWeight: '400',
    marginTop: 2,
  },
  tabLabelFocused: {
    color: '#AA4A44',
    fontWeight: '600',
  },
});
