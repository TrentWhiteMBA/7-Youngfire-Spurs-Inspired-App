import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Shield, ExternalLink, Flame, Users, BookOpen, 
  Calendar, Plus, Clock, Video, Trash2, Search, Mail, Phone, 
  MapPin, Cake, UserPlus, X, Check, MessageSquare, Send, Edit3,
  AlertTriangle, Lock, Sparkles
} from 'lucide-react';
import { CurrentUser } from './SettingsHUDModal';
import { READING_PLANS } from '../data/readingPlansData';
import { ReadingPlanCard } from './ReadingPlanCard';
import { 
  getStoredGatheringEvents, 
  saveGatheringEvent, 
  deleteGatheringEvent, 
  GatheringEvent 
} from '../data/gatheringEventsData';
import { parseScriptureRefToNav } from '../data/kingdomMediaData';
import { RosterMember } from './MemberRosterModal';

interface MenOnFireHubProps {
  onBack?: () => void;
  currentUser?: CurrentUser | null;
  onNavigateToScripture?: (bookId: string, chapter: number) => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  avatarText: string;
  avatarUrl?: string;
  text: string;
  timestamp: string;
}

export const MenOnFireHub: React.FC<MenOnFireHubProps> = ({
  onBack,
  currentUser,
  onNavigateToScripture
}) => {
  // 1. Strict Gender Isolation Access Check:
  // Non-admin females cannot view Men On Fire; admins (Trent/Whitney or currentUser.isAdmin) can view both.
  const isAuthorized = useMemo(() => {
    if (!currentUser) return true; // allow guest preview with caution or default to true
    if (currentUser.isAdmin) return true;
    const nameLower = (currentUser.name || '').toLowerCase();
    const emailLower = (currentUser.email || '').toLowerCase();
    if (nameLower.includes('trent') || nameLower.includes('whitney') || emailLower.includes('trent') || emailLower.includes('whitney')) {
      return true;
    }
    // Female non-admin is strictly forbidden
    if (currentUser.gender === 'female') {
      return false;
    }
    return true;
  }, [currentUser]);

  // Active sister hub tab
  const [activeTab, setActiveTab] = useState<'events' | 'roster' | 'plans' | 'chat'>('events');

  // Gathering Events state
  const [gatheringEvents, setGatheringEvents] = useState<GatheringEvent[]>(() => {
    const all = getStoredGatheringEvents();
    return all.filter(e => e.groupTag === '#MenOnFire' || e.targetAudience === 'men');
  });

  // Modal for Scheduling New Gathering Event
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventScripture, setEventScripture] = useState('Proverbs 27:17');
  const [eventFocus, setEventFocus] = useState('');
  const [eventDate, setEventDate] = useState(() => {
    // Default to upcoming Monday
    const d = new Date();
    const day = d.getDay();
    const diff = (8 - day) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  });
  const [eventTime, setEventTime] = useState('7:00 PM CST');
  const [eventZoomUrl, setEventZoomUrl] = useState('https://us05web.zoom.us/j/8785161298?pwd=e0zBTD2QHIHfx0AzjzXG7EHQno9Oig.1&omn=85728476365');
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Brotherhood Roster State
  const [rosterMembers, setRosterMembers] = useState<RosterMember[]>([]);
  const [rosterSearch, setRosterSearch] = useState('');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Brother');
  const [newMemberCalling, setNewMemberCalling] = useState('Brotherhood Praise & Armor');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberBirthday, setNewMemberBirthday] = useState('');
  const [newMemberResidence, setNewMemberResidence] = useState('San Antonio, TX');

  // Live Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('youngfire_chat_threads_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.men)) return parsed.men;
      }
    } catch {}
    return [
      {
        id: 'msg_m1',
        sender: 'Trent D. White',
        role: 'Lead Facilitator & Overseer',
        avatarText: 'TW',
        avatarUrl: '/images/jhow_pulpit_leadership_1790403554820.jpg',
        text: 'Brothers: "As iron sharpens iron, so one man sharpens another." (Proverbs 27:17). Stand firm this week!',
        timestamp: 'Today @ 9:15 AM'
      },
      {
        id: 'msg_m2',
        sender: 'Caleb Joshua Vance',
        role: 'Worship & Media Technology',
        avatarText: 'CV',
        avatarUrl: '/images/young_adults_prayer_1790403569974.jpg',
        text: 'Amen Pastor Trent. Ready for Monday night zoom huddle. Bringing two brothers from college.',
        timestamp: 'Today @ 11:30 AM'
      }
    ];
  });
  const [newChatText, setNewChatText] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatText, setEditingChatText] = useState('');

  // Sync Gathering Events from storage / event bus
  const reloadEvents = () => {
    const all = getStoredGatheringEvents();
    setGatheringEvents(all.filter(e => e.groupTag === '#MenOnFire' || e.targetAudience === 'men'));
  };

  useEffect(() => {
    const handleEventsUpdated = () => {
      reloadEvents();
    };
    window.addEventListener('sanctuary_calendar_events_updated', handleEventsUpdated);
    return () => window.removeEventListener('sanctuary_calendar_events_updated', handleEventsUpdated);
  }, []);

  // Fetch Roster (filter male members)
  useEffect(() => {
    const loadRoster = () => {
      fetch('/api/roster')
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.members)) {
            const males = data.members.filter((m: RosterMember) => 
              m.gender === 'male' || m.group === 'Men On Fire' || (m.role && m.role.toLowerCase().includes('brother'))
            );
            setRosterMembers(males);
          } else {
            fallbackRoster();
          }
        })
        .catch(() => {
          fallbackRoster();
        });
    };

    const fallbackRoster = () => {
      try {
        const saved = localStorage.getItem('youngfire_member_roster_v2');
        if (saved) {
          const list: RosterMember[] = JSON.parse(saved);
          const males = list.filter(m => m.gender === 'male' || m.group === 'Men On Fire');
          setRosterMembers(males);
          return;
        }
      } catch {}

      // Default male roster members
      setRosterMembers([
        {
          id: 'roster_trent',
          fullName: 'Trent D. White',
          role: 'Lead Facilitator & Overseer',
          calling: 'Preaching & Discipleship Leadership',
          group: 'Men On Fire',
          gender: 'male',
          avatar: '/images/jhow_pulpit_leadership_1790403554820.jpg',
          email: 'trentwhite0308@gmail.com',
          phone: '(210) 555-0198',
          birthday: '03-08',
          churchMembership: 'Joshua House of Worship',
          residence: 'San Antonio, TX'
        },
        {
          id: 'roster_caleb',
          fullName: 'Caleb Joshua Vance',
          role: 'Brother (Young Adult Disciple)',
          calling: 'Worship & Media Technology',
          group: 'Men On Fire',
          gender: 'male',
          avatar: '/images/young_adults_prayer_1790403569974.jpg',
          email: 'caleb.vance@jhow.org',
          phone: '(210) 555-0144',
          birthday: '09-14',
          churchMembership: 'Joshua House of Worship',
          residence: 'San Antonio, TX'
        },
        {
          id: 'roster_marcus',
          fullName: 'Marcus Aurelius Vance',
          role: 'Brother (Young Adult Disciple)',
          calling: 'Outreach & Brotherhood Armor',
          group: 'Men On Fire',
          gender: 'male',
          avatar: '/images/fellowship_painting_1790403613370.jpg',
          email: 'marcus.vance@jhow.org',
          phone: '(210) 555-0182',
          birthday: '10-04',
          churchMembership: 'Joshua House of Worship',
          residence: 'San Antonio, TX'
        }
      ]);
    };

    loadRoster();
  }, []);

  // Save Chat to storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('youngfire_chat_threads_v2');
      const parsed = saved ? JSON.parse(saved) : {};
      parsed.men = chatMessages;
      localStorage.setItem('youngfire_chat_threads_v2', JSON.stringify(parsed));
    } catch {}
  }, [chatMessages]);

  // If unauthorized female non-admin user
  if (!isAuthorized) {
    return (
      <div className="bg-[#0B1329] border border-orange-500/40 rounded-3xl p-8 text-center space-y-4 shadow-2xl max-w-lg mx-auto my-12 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold">
            Access Restricted &bull; Gender Isolation Gate
          </span>
          <h3 className="text-xl font-black uppercase text-white font-['Outfit']">
            Men On Fire Consecrated Space
          </h3>
        </div>
        <p className="text-sm font-mono text-orange-300 font-semibold">
          Men On Fire is a consecrated space reserved for male disciples and brotherhood facilitators.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed font-serif">
          Sister disciples are warmly welcomed in the sisterhood hub: Women Ignited, where dedicated reading plans, sisterhood prayer huddles, and fellowship events await.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold font-mono text-xs cursor-pointer shadow-lg shadow-orange-500/20 transition-all inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Fellowship Hub</span>
          </button>
        )}
      </div>
    );
  }

  // Handle Create Gathering Event
  const handleCreateGathering = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      setFormError('Event title is required.');
      return;
    }
    if (!eventScripture.trim()) {
      setFormError('Scripture reference is required.');
      return;
    }
    if (!eventFocus.trim()) {
      setFormError('Focus / topic is required.');
      return;
    }
    if (!eventDate) {
      setFormError('Date is required.');
      return;
    }

    const newEvt: GatheringEvent = {
      id: `mof_evt_${Date.now()}`,
      title: eventTitle.trim(),
      scriptureRef: eventScripture.trim(),
      focusTopic: eventFocus.trim(),
      dateTime: `${eventDate}T${eventTime.includes('7') ? '19:00' : '18:30'}`,
      date: eventDate,
      time: eventTime.trim() || '7:00 PM CST',
      zoomUrl: eventZoomUrl.trim() || 'https://us05web.zoom.us/j/8785161298?pwd=e0zBTD2QHIHfx0AzjzXG7EHQno9Oig.1&omn=85728476365',
      zoomMeetingId: '878 516 1298',
      zoomPasscode: 'FIRE2026',
      groupTag: '#MenOnFire',
      targetAudience: 'men',
      createdBy: currentUser?.name || 'Trent D. White',
      createdRole: currentUser?.role || 'Brotherhood Facilitator',
      location: 'Virtual Sanctuary Zoom Bridge & Living Room',
      description: `${eventFocus.trim()} (Scripture: ${eventScripture.trim()}). Brotherhood gathering for spiritual armor and prayer.`
    };

    saveGatheringEvent(newEvt);
    reloadEvents();
    setIsAddEventOpen(false);
    setEventTitle('');
    setEventFocus('');
    setFormError('');
    setSuccessToast(`Gathering "${newEvt.title}" scheduled and synchronized to Master Sanctuary Calendar with Orange #MenOnFire badge!`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Handle Delete Gathering Event
  const handleDeleteGathering = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this brotherhood gathering event from the Sanctuary Calendar?')) {
      deleteGatheringEvent(id);
      reloadEvents();
    }
  };

  // Handle Add Member to Brotherhood Roster
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newDoc: RosterMember = {
      id: `member_m_${Date.now()}`,
      fullName: newMemberName.trim(),
      name: newMemberName.trim(),
      role: newMemberRole.trim() || 'Brother',
      calling: newMemberCalling.trim() || 'Brotherhood Praise & Armor',
      group: 'Men On Fire',
      gender: 'male',
      churchMembership: 'Joshua House of Worship',
      residence: newMemberResidence.trim() || 'San Antonio, TX',
      email: newMemberEmail.trim(),
      phone: newMemberPhone.trim(),
      birthday: newMemberBirthday.trim()
    };

    const updated = [newDoc, ...rosterMembers];
    setRosterMembers(updated);
    setIsAddMemberOpen(false);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPhone('');
    setNewMemberBirthday('');

    try {
      const saved = localStorage.getItem('youngfire_member_roster_v2');
      const all: RosterMember[] = saved ? JSON.parse(saved) : [];
      all.unshift(newDoc);
      localStorage.setItem('youngfire_member_roster_v2', JSON.stringify(all));

      await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc)
      });
    } catch {}

    setSuccessToast(`Brother ${newDoc.fullName} registered to Brotherhood Roster!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Handle Send Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;

    const msg: ChatMessage = {
      id: `msg_m_${Date.now()}`,
      sender: currentUser?.name || 'Brother Disciple',
      role: currentUser?.role || 'Brother',
      avatarText: (currentUser?.name || 'BD').slice(0, 2).toUpperCase(),
      avatarUrl: currentUser?.avatar,
      text: newChatText.trim(),
      timestamp: 'Just now'
    };

    setChatMessages(prev => [...prev, msg]);
    setNewChatText('');
  };

  // Filtered Roster Members
  const filteredRoster = useMemo(() => {
    if (!rosterSearch.trim()) return rosterMembers;
    const q = rosterSearch.toLowerCase();
    return rosterMembers.filter(m => 
      (m.fullName || m.name || '').toLowerCase().includes(q) ||
      (m.calling || '').toLowerCase().includes(q) ||
      (m.role || '').toLowerCase().includes(q) ||
      (m.residence || '').toLowerCase().includes(q)
    );
  }, [rosterMembers, rosterSearch]);

  const menPlans = READING_PLANS.filter(p => p.category === 'men');

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-[#0B1329] border border-white/15 text-slate-200 hover:text-white hover:border-orange-500/40 cursor-pointer transition-all shadow-md"
              title="Return to Fellowship Hub"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/30">
                Brotherhood Cohort &bull; Led by Trent White
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold">
                #MenOnFire
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-['Outfit'] uppercase text-white tracking-wide mt-1 flex items-center gap-2">
              <span>Men On Fire Sanctuary Hub</span>
              <Shield className="w-5 h-5 text-orange-400" />
            </h2>
          </div>
        </div>

        {/* Quick Action: Schedule Gathering Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddEventOpen(true)}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 shadow-lg shadow-orange-500/20 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Gathering</span>
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="p-3.5 rounded-2xl bg-orange-500/20 border border-orange-500/60 text-orange-200 text-xs font-mono flex items-center justify-between gap-3 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
          <button 
            onClick={() => setSuccessToast(null)}
            className="p-1 text-orange-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Persistent Men On Fire Zoom HUD Card */}
      <div className="bg-[#0B1329] border border-orange-500/40 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400 flex-shrink-0 shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-orange-400 font-bold block">
                Consecrated Brotherhood Gathering
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-bold">
                Mondays @ 7:00 PM CST
              </span>
            </div>
            <p className="text-sm text-white font-mono font-bold mt-0.5">
              Meeting ID: <span className="text-amber-300">878 516 1298</span> &bull; Passcode: <span className="text-amber-300">FIRE2026</span>
            </p>
            <p className="text-xs text-slate-400 font-serif">Living room & video sanctuary bridge with Pastor Trent White</p>
          </div>
        </div>

        <a
          href="https://us05web.zoom.us/j/8785161298?pwd=e0zBTD2QHIHfx0AzjzXG7EHQno9Oig.1&omn=85728476365"
          target="_blank"
          rel="noreferrer"
          className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black font-['Outfit'] uppercase text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/30 self-start sm:self-center cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Launch Zoom Huddle</span>
        </a>
      </div>

      {/* Sister Hub Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-[#080E21] border border-white/10 rounded-2xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'events'
              ? 'bg-orange-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Gathering Events ({gatheringEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-orange-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Brotherhood Roster ({rosterMembers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-orange-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Reading Plans ({menPlans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-orange-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Live Chat ({chatMessages.length})</span>
        </button>
      </div>

      {/* TAB 1: GATHERING EVENTS */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <h3 className="text-base font-black font-['Outfit'] uppercase text-white tracking-wide flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-400" />
                <span>Brotherhood Gathering Events</span>
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Synchronized directly with the Master Fellowship Sanctuary Calendar with Orange <span className="text-orange-400 font-bold">#MenOnFire</span> badge.
              </p>
            </div>
            <button
              onClick={() => setIsAddEventOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Event</span>
            </button>
          </div>

          {gatheringEvents.length === 0 ? (
            <div className="p-8 text-center bg-[#0B1329] border border-white/10 rounded-3xl space-y-3">
              <Calendar className="w-10 h-10 text-orange-400/50 mx-auto" />
              <p className="text-sm text-slate-300 font-serif">No custom brotherhood gatherings scheduled yet.</p>
              <button
                onClick={() => setIsAddEventOpen(true)}
                className="px-4 py-2 rounded-xl bg-orange-500 text-slate-950 font-bold text-xs font-mono cursor-pointer"
              >
                + Schedule First Brotherhood Gathering
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gatheringEvents.map((evt) => {
                const scriptureNav = parseScriptureRefToNav(evt.scriptureRef);

                return (
                  <div
                    key={evt.id}
                    className="p-5 rounded-3xl bg-[#0B1329] border border-orange-500/30 hover:border-orange-500/60 transition-all shadow-xl space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold uppercase">
                              {evt.groupTag || '#MenOnFire'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {evt.date} &bull; {evt.time}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white font-['Outfit'] mt-1">
                            {evt.title}
                          </h4>
                        </div>

                        <button
                          onClick={(e) => handleDeleteGathering(evt.id, e)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Gathering Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Scripture Reference Badge with Deep Link */}
                      {evt.scriptureRef && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5 bg-cyan-950/40 px-2.5 py-1 rounded-xl border border-cyan-500/30">
                            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Scripture: {evt.scriptureRef}</span>
                          </span>

                          {scriptureNav && onNavigateToScripture && (
                            <button
                              onClick={() => onNavigateToScripture(scriptureNav.bookId, scriptureNav.chapter)}
                              className="text-[10px] font-mono text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <span>Open in Reader &rarr;</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Focus / Topic */}
                      <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                        <span className="text-[10px] font-mono uppercase text-orange-400 font-bold block">
                          Focus & Kingdom Topic:
                        </span>
                        <p className="text-xs text-slate-200 font-serif leading-relaxed">
                          {evt.focusTopic}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        Host: {evt.createdBy || 'Trent D. White'}
                      </span>

                      <a
                        href={evt.zoomUrl || 'https://us05web.zoom.us/j/8785161298?pwd=e0zBTD2QHIHfx0AzjzXG7EHQno9Oig.1&omn=85728476365'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Launch Zoom</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BROTHERHOOD ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-black font-['Outfit'] uppercase text-white tracking-wide flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-400" />
                <span>Brotherhood Roster ({filteredRoster.length})</span>
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Registered male disciples, leadership facilitators, contact directory and kingdom callings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search brothers..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 w-44 sm:w-56"
                />
              </div>

              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Register Brother</span>
              </button>
            </div>
          </div>

          {/* Roster Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredRoster.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-3xl bg-[#0B1329] border border-orange-500/25 hover:border-orange-500/50 transition-all shadow-xl space-y-3"
              >
                <div className="flex items-center gap-3">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.fullName || member.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-orange-500/40 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 font-black font-['Outfit'] flex items-center justify-center text-sm flex-shrink-0">
                      {(member.fullName || member.name || 'B').slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate font-['Outfit']">
                      {member.fullName || member.name}
                    </h4>
                    <span className="text-[10px] font-mono text-orange-300 block truncate">
                      {member.role || 'Brother'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 block truncate">
                      {member.churchMembership || 'Joshua House of Worship'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Calling:</span>
                    <span className="text-amber-300 font-bold truncate max-w-[170px]">{member.calling}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Residence:</span>
                    <span className="text-slate-200">{member.residence || 'San Antonio, TX'}</span>
                  </div>
                  {member.birthday && (
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Cake className="w-3 h-3 text-amber-400" />
                        <span>Birthday:</span>
                      </span>
                      <span className="text-amber-400 font-bold">{member.birthday}</span>
                    </div>
                  )}
                </div>

                {/* Contact Links */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-[11px] font-mono">
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-orange-500/20 text-slate-300 hover:text-orange-300 flex items-center gap-1 transition-colors"
                      title={member.email}
                    >
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{member.email}</span>
                    </a>
                  )}
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-orange-500/20 text-slate-300 hover:text-orange-300 flex items-center gap-1 transition-colors"
                      title={member.phone}
                    >
                      <Phone className="w-3 h-3" />
                      <span>{member.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: READING PLANS */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <h3 className="text-base font-black font-['Outfit'] uppercase text-white tracking-wide">
                Men On Fire Dedicated Reading Plans
              </h3>
            </div>
            <span className="text-[10px] font-mono text-orange-300 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30">
              {menPlans.length} Consecrated Plans
            </span>
          </div>

          <div className="space-y-4">
            {menPlans.map(plan => (
              <ReadingPlanCard
                key={plan.id}
                plan={plan}
                onNavigateToScripture={onNavigateToScripture}
                defaultExpanded={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BROTHERHOOD LIVE CHAT */}
      {activeTab === 'chat' && (
        <div className="bg-[#0B1329] border border-orange-500/30 rounded-3xl p-5 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-400" />
              <span>Men On Fire Brotherhood Chat</span>
              <span className="text-[10px] text-slate-400">({chatMessages.length} Messages)</span>
            </h4>
          </div>

          <div className="h-64 overflow-y-auto space-y-2.5 pr-1">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="p-3 bg-slate-950/70 rounded-2xl border border-white/5 text-xs flex items-start gap-3">
                {msg.avatarUrl ? (
                  <img 
                    src={msg.avatarUrl} 
                    alt={msg.sender} 
                    className="w-8 h-8 rounded-full object-cover border border-orange-500/40 flex-shrink-0 mt-0.5" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center text-[11px] font-bold font-mono flex-shrink-0 mt-0.5">
                    {msg.avatarText || (msg.sender || 'B').slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <strong className="text-orange-400">{msg.sender}</strong>
                      {msg.role && (
                        <span className="text-[9px] text-slate-400 px-1.5 py-0.2 rounded bg-white/5 border border-white/10">
                          {msg.role}
                        </span>
                      )}
                    </div>
                    <span>{msg.timestamp}</span>
                  </div>

                  {editingChatId === msg.id ? (
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={editingChatText}
                        onChange={(e) => setEditingChatText(e.target.value)}
                        className="flex-1 bg-black border border-orange-400 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                      <button
                        onClick={() => {
                          setChatMessages(prev => prev.map(m => m.id === msg.id ? { ...m, text: editingChatText } : m));
                          setEditingChatId(null);
                        }}
                        className="px-3 py-1 bg-orange-500 text-slate-950 font-bold rounded-lg text-[10px] cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingChatId(null)}
                        className="px-2 py-1 bg-white/10 text-slate-300 rounded-lg text-[10px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-200 leading-relaxed font-serif">{msg.text}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-60 hover:opacity-100 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditingChatId(msg.id);
                      setEditingChatText(msg.text);
                    }}
                    className="p-1 hover:text-amber-300 cursor-pointer"
                    title="Edit Message"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      setChatMessages(prev => prev.filter(m => m.id !== msg.id));
                    }}
                    className="p-1 hover:text-rose-400 cursor-pointer"
                    title="Delete Message"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-white/5">
            <input
              type="text"
              placeholder="Post brotherhood encouragement, verse meditation, or prayer request..."
              value={newChatText}
              onChange={(e) => setNewChatText(e.target.value)}
              className="flex-1 bg-[#070C1C] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* MODAL 1: SCHEDULE BROTHERHOOD GATHERING EVENT */}
      {isAddEventOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsAddEventOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-[#0B1329] border border-orange-500/50 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative text-white animate-scaleUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black font-['Outfit'] uppercase text-white">
                    Schedule Men On Fire Gathering
                  </h3>
                  <span className="text-[10px] font-mono text-orange-400 font-bold">
                    Automatically syncs with Sanctuary Calendar as #MenOnFire
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsAddEventOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateGathering} className="space-y-3.5">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center justify-between">
                  <span>1. Gathering Title *</span>
                  <span className="text-[10px] text-orange-400">Required</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Iron Sharpens Iron: Consecrated Brotherhood Huddle"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-[#070C1C] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* Scripture Reference */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center justify-between">
                  <span>2. Scripture Reference *</span>
                  <span className="text-[10px] text-cyan-400">Required &bull; Deep-linked</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Proverbs 27:17, 1 Corinthians 16:13, Ephesians 6:10-18"
                  value={eventScripture}
                  onChange={(e) => setEventScripture(e.target.value)}
                  className="w-full bg-[#070C1C] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  required
                />
                {/* Scripture Quick Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Proverbs 27:17', '1 Corinthians 16:13', 'Ephesians 6:10-18', '2 Timothy 2:2'].map(ref => (
                    <button
                      type="button"
                      key={ref}
                      onClick={() => setEventScripture(ref)}
                      className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-orange-500/20 text-[10px] font-mono text-slate-300 hover:text-orange-300 border border-white/5 transition-colors cursor-pointer"
                    >
                      {ref}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus / Topic */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center justify-between">
                  <span>3. Focus / Topic *</span>
                  <span className="text-[10px] text-orange-400">Required</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Spiritual Armor, Leadership in the Home, and Unwavering Kingdom Integrity"
                  value={eventFocus}
                  onChange={(e) => setEventFocus(e.target.value)}
                  className="w-full bg-[#070C1C] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold">
                    4. Gathering Date *
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-[#070C1C] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold">
                    5. Time Cadence *
                  </label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full bg-[#070C1C] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    placeholder="e.g. 7:00 PM CST"
                    required
                  />
                </div>
              </div>

              {/* Optional Zoom Meeting URL */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center justify-between">
                  <span>6. Zoom Meeting URL</span>
                  <span className="text-[10px] text-slate-400">Optional (Pre-filled)</span>
                </label>
                <input
                  type="url"
                  value={eventZoomUrl}
                  onChange={(e) => setEventZoomUrl(e.target.value)}
                  className="w-full bg-[#070C1C] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  placeholder="https://us05web.zoom.us/..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddEventOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Publish to Calendar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER BROTHER TO BROTHERHOOD ROSTER */}
      {isAddMemberOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsAddMemberOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-[#0B1329] border border-orange-500/50 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative text-white animate-scaleUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-black font-['Outfit'] uppercase text-white">
                  Register Brother
                </h3>
              </div>
              <button 
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-slate-300 font-bold">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. David Solomon Vance"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full bg-[#070C1C] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold">Role</label>
                  <input
                    type="text"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full bg-[#070C1C] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold">Birthday (MM-DD)</label>
                  <input
                    type="text"
                    placeholder="09-14"
                    value={newMemberBirthday}
                    onChange={(e) => setNewMemberBirthday(e.target.value)}
                    className="w-full bg-[#070C1C] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-slate-300 font-bold">Spiritual Calling</label>
                <input
                  type="text"
                  placeholder="e.g. Brotherhood Armor, Worship, Intercession"
                  value={newMemberCalling}
                  onChange={(e) => setNewMemberCalling(e.target.value)}
                  className="w-full bg-[#070C1C] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold">Email</label>
                  <input
                    type="email"
                    placeholder="david@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full bg-[#070C1C] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold">Phone</label>
                  <input
                    type="tel"
                    placeholder="(210) 555-0100"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    className="w-full bg-[#070C1C] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-slate-300 font-bold">Residence City</label>
                <input
                  type="text"
                  value={newMemberResidence}
                  onChange={(e) => setNewMemberResidence(e.target.value)}
                  className="w-full bg-[#070C1C] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Brother</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
