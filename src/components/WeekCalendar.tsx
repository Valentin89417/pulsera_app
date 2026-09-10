import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router/react-navigation';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';
import { getSetting } from '../services/api';
import {
  getWeekEvents,
  getWeekDays,
  formatDayHeader,
  formatDayNumber,
  formatEventTime,
  isToday,
  CalendarEvent,
} from '../utils/calendar';

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  daysScroll: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  dayButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    minWidth: 44,
    marginHorizontal: 4,
  },
  dayButtonToday: {
    backgroundColor: colors.primary,
  },
  dayName: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: '500',
  },
  dayNameToday: {
    color: colors.onPrimary,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dayNumberToday: {
    color: colors.onPrimary,
  },
  eventsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  eventsDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
    fontWeight: '500',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  eventColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    marginRight: 10,
  },
  eventContent: {
    flex: 1,
  },
  eventTime: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  eventLocation: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyDay: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  loaderContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noCalendar: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noCalendarText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});

export function WeekCalendar() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [hasUrl, setHasUrl] = useState(false);

  const weekDays = getWeekDays();

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const calendarUrl = await getSetting('calendar_url');

      if (!calendarUrl || !calendarUrl.trim()) {
        setHasUrl(false);
        setLoading(false);
        return;
      }

      setHasUrl(true);
      const weekEvents = await getWeekEvents(calendarUrl);
      setEvents(weekEvents);
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  // Фильтрация событий для выбранного дня
  const getEventsForDay = (day: Date): CalendarEvent[] => {
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === day.getDate() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getFullYear() === day.getFullYear()
      );
    });
  };

  const selectedDayEvents = getEventsForDay(selectedDay);

  // Формат даты для заголовка
  const formatDateTitle = (date: Date): string => {
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const dayName = isToday(date) ? 'Сегодня' : '';
    return `${dayName ? dayName + ', ' : ''}${day} ${month}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Расписание на неделю</Text>
        <View style={styles.calendarCard}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        </View>
      </View>
    );
  }

  if (!hasUrl) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Расписание на неделю</Text>
      <View style={styles.calendarCard}>
        {/* Горизонтальный список дней */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysScroll}
        >
          {weekDays.map((day, index) => {
            const dayIsToday = isToday(day);
            const isSelected =
              day.getDate() === selectedDay.getDate() &&
              day.getMonth() === selectedDay.getMonth() &&
              day.getFullYear() === selectedDay.getFullYear();
            const hasEvents = getEventsForDay(day).length > 0;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  dayIsToday && styles.dayButtonToday,
                  isSelected && !dayIsToday && {
                    backgroundColor: colors.primaryAlpha20,
                  },
                ]}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayName,
                    dayIsToday && styles.dayNameToday,
                  ]}
                >
                  {formatDayHeader(day)}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    dayIsToday && styles.dayNumberToday,
                  ]}
                >
                  {formatDayNumber(day)}
                </Text>
                {hasEvents && !dayIsToday && (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: colors.primary,
                      marginTop: 4,
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* События выбранного дня */}
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsDate}>{formatDateTitle(selectedDay)}</Text>

          {selectedDayEvents.length === 0 ? (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayText}>Нет событий</Text>
            </View>
          ) : (
            selectedDayEvents.map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <View
                  style={[styles.eventColorDot, { backgroundColor: event.color }]}
                />
                <View style={styles.eventContent}>
                  <Text style={styles.eventTime}>
                    {event.isAllDay ? 'Весь день' : formatEventTime(event.startDate)}
                  </Text>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.location && (
                    <Text style={styles.eventLocation}>
                      <FontAwesome name="map-marker" size={10} color={colors.textMuted} />{' '}
                      {event.location}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
}
