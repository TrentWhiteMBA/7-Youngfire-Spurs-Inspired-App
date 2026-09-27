/**
 * Gathering Events & Sanctuary Calendar Types & Helpers
 */

export interface GatheringEvent {
  id: string;
  title: string;
  scriptureRef: string;
  focusTopic: string;
  dateTime: string; // ISO string or 'YYYY-MM-DDTHH:mm'
  date: string; // YYYY-MM-DD
  time: string; // e.g. '7:00 PM CST'
  zoomUrl?: string;
  zoomMeetingId?: string;
  zoomPasscode?: string;
  groupTag: '#MenOnFire' | '#WomenIgnited' | '#YoungFire';
  targetAudience: 'men' | 'women' | 'all';
  createdBy?: string;
  createdRole?: string;
  location?: string;
  description?: string;
  status?: 'active' | 'canceled' | 'rescheduled';
}

export const SANCTUARY_EVENTS_STORAGE_KEY = 'sanctuary_calendar_events';

export const getStoredGatheringEvents = (): GatheringEvent[] => {
  try {
    const raw = localStorage.getItem(SANCTUARY_EVENTS_STORAGE_KEY);
    if (!raw) {
      // Seed default authentic gatherings for Men & Women
      const defaults: GatheringEvent[] = [
        {
          id: 'mof_gathering_launch',
          title: 'Iron Sharpens Iron: Consecrated Brotherhood Huddle',
          scriptureRef: 'Proverbs 27:17',
          focusTopic: 'Spiritual Armor, Leadership in the Home, and Unwavering Kingdom Integrity',
          dateTime: '2026-09-28T19:00',
          date: '2026-09-28',
          time: '7:00 PM CST',
          zoomUrl: 'https://us05web.zoom.us/j/8785161298?pwd=e0zBTD2QHIHfx0AzjzXG7EHQno9Oig.1&omn=85728476365',
          zoomMeetingId: '878 516 1298',
          zoomPasscode: 'FIRE2026',
          groupTag: '#MenOnFire',
          targetAudience: 'men',
          createdBy: 'Trent D. White',
          createdRole: 'Lead Facilitator & Overseer',
          location: 'Virtual Sanctuary Zoom Bridge'
        },
        {
          id: 'wi_gathering_launch',
          title: 'Proverbs 31 Sacred Flame: Sisterhood Prayer Circle',
          scriptureRef: 'Proverbs 31:25–26',
          focusTopic: 'Strength, Dignity, and Living Without Fear of the Future',
          dateTime: '2026-10-01T18:30',
          date: '2026-10-01',
          time: '6:30 PM CST',
          zoomUrl: 'https://us05web.zoom.us/j/8785161298?pwd=e0zBTD2QHIHfx0AzjzXG7EHQno9Oig.1&omn=85728476365',
          zoomMeetingId: '878 516 1298',
          zoomPasscode: 'FIRE2026',
          groupTag: '#WomenIgnited',
          targetAudience: 'women',
          createdBy: 'Whitney White',
          createdRole: 'Lead Facilitator & Sisterhood Overseer',
          location: 'Virtual Sanctuary Zoom Bridge'
        }
      ];
      localStorage.setItem(SANCTUARY_EVENTS_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading sanctuary_calendar_events:', err);
    return [];
  }
};

export const saveGatheringEvent = (event: GatheringEvent): GatheringEvent[] => {
  const current = getStoredGatheringEvents();
  const existingIdx = current.findIndex(e => e.id === event.id);
  let updated: GatheringEvent[];
  if (existingIdx >= 0) {
    updated = current.map(e => e.id === event.id ? event : e);
  } else {
    updated = [event, ...current];
  }
  try {
    localStorage.setItem(SANCTUARY_EVENTS_STORAGE_KEY, JSON.stringify(updated));
    // Broadcast event so other components (Calendar, Hubs) sync immediately
    window.dispatchEvent(new CustomEvent('sanctuary_calendar_events_updated', {
      detail: { events: updated, newEvent: event }
    }));
  } catch (err) {
    console.error('Failed saving gathering event to storage:', err);
  }

  // Sync to server API in background
  try {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: event.id,
        title: event.title,
        type: event.groupTag === '#MenOnFire' ? 'Men On Fire' : event.groupTag === '#WomenIgnited' ? 'Women Ignited' : 'Small Group',
        date: event.date,
        time: event.time,
        description: event.focusTopic ? `${event.scriptureRef}: ${event.focusTopic}` : event.description,
        isZoom: Boolean(event.zoomUrl),
        zoomUrl: event.zoomUrl,
        groupTag: event.groupTag
      })
    }).catch(() => {});
  } catch {}

  return updated;
};

export const deleteGatheringEvent = (id: string): GatheringEvent[] => {
  const current = getStoredGatheringEvents();
  const updated = current.filter(e => e.id !== id);
  try {
    localStorage.setItem(SANCTUARY_EVENTS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sanctuary_calendar_events_updated', {
      detail: { events: updated, deletedId: id }
    }));
  } catch (err) {
    console.error('Failed deleting gathering event:', err);
  }
  return updated;
};
