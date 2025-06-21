import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import { API, Category } from '../types';
import { parseISO, addMonths, addYears } from 'date-fns';
import { getNextBillingDate, shouldShowAsRenewal } from '../utils/billing';
import { getCategoryById } from '../utils/categories';
import { generateICalFile } from '../utils/icalGenerator';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarView.css';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  api: API;
  type: 'renewal' | 'expiry';
  category: Category | undefined;
  resource?: any;
}

interface CalendarViewProps {
  apis: API[];
  categories: Category[];
  onEditAPI: (api: API) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ apis, categories, onEditAPI }) => {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'paid' | 'free'>('all');

  // Convert APIs to calendar events
  const events = useMemo<CalendarEvent[]>(() => {
    const calendarEvents: CalendarEvent[] = [];
    
    apis.forEach(api => {
      // Filter by subscription type
      if (filterType !== 'all' && api.subscriptionType !== filterType) {
        return;
      }
      
      // Filter by category
      if (filterCategory !== 'all' && api.category !== filterCategory) {
        return;
      }
      
      const category = getCategoryById(categories, api.category);
      
      if (api.expiryDate) {
        const expiryDate = parseISO(api.expiryDate);
        
        if (shouldShowAsRenewal(api)) {
          // For auto-renewing subscriptions, show next billing dates
          let nextDate = getNextBillingDate(api.expiryDate, api.billingCycle);
          
          // Add multiple future renewal events (next 3 renewals)
          for (let i = 0; i < 3; i++) {
            if (nextDate) {
              calendarEvents.push({
                id: `${api.id}-renewal-${i}`,
                title: `${api.serviceName} - Renewal`,
                start: nextDate,
                end: nextDate,
                api,
                type: 'renewal',
                category,
                resource: {
                  cost: api.cost,
                  billingCycle: api.billingCycle
                }
              });
              
              // Calculate next renewal
              if (api.billingCycle === 'monthly') {
                nextDate = addMonths(nextDate, 1);
              } else if (api.billingCycle === 'yearly') {
                nextDate = addYears(nextDate, 1);
              }
            }
          }
        } else {
          // For non-renewing subscriptions, show expiry
          calendarEvents.push({
            id: `${api.id}-expiry`,
            title: `${api.serviceName} - Expires`,
            start: expiryDate,
            end: expiryDate,
            api,
            type: 'expiry',
            category,
            resource: {
              cost: api.cost,
              billingCycle: api.billingCycle
            }
          });
        }
      }
    });
    
    return calendarEvents;
  }, [apis, categories, filterCategory, filterType]);

  // Custom event style
  const eventStyleGetter = (event: any, start: Date, end: Date, isSelected: boolean) => {
    const calendarEvent = event as CalendarEvent;
    const backgroundColor = calendarEvent.category?.color || '#6b7280';
    const isExpiry = calendarEvent.type === 'expiry';
    
    return {
      style: {
        backgroundColor: isExpiry ? '#dc2626' : backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.85rem',
        padding: '2px 5px'
      }
    };
  };

  // Handle event selection
  const handleSelectEvent = (event: any, e: React.SyntheticEvent<HTMLElement>) => {
    setSelectedEvent(event as CalendarEvent);
    setShowEventModal(true);
  };

  // Handle export to iCal
  const handleExportCalendar = () => {
    const selectedCategories = filterCategory !== 'all' ? [filterCategory] : undefined;
    const blob = generateICalFile(apis, categories, {
      includeReminders: true,
      reminderDays: [7, 3, 1],
      selectedCategories
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subalert-calendar-${new Date().toISOString().split('T')[0]}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Custom toolbar component
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };

    return (
      <div className="calendar-toolbar">
        <div className="toolbar-nav">
          <button className="btn btn-secondary" onClick={goToToday}>
            Today
          </button>
          <button className="btn btn-icon" onClick={goToBack}>
            ‹
          </button>
          <button className="btn btn-icon" onClick={goToNext}>
            ›
          </button>
          <span className="toolbar-label">{toolbar.label}</span>
        </div>
        
        <div className="toolbar-filters">
          <select 
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
          
          <select 
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="all">All Types</option>
            <option value="paid">Paid Only</option>
            <option value="free">Free Only</option>
          </select>
          
          <button
            className="btn btn-secondary"
            onClick={handleExportCalendar}
          >
            📤 Export iCal
          </button>
          
          <div className="view-buttons">
            <button
              className={`btn ${view === 'month' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView('month')}
            >
              Month
            </button>
            <button
              className={`btn ${view === 'week' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView('week')}
            >
              Week
            </button>
            <button
              className={`btn ${view === 'agenda' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView('agenda')}
            >
              List
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100vh - 120px)' }}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleSelectEvent}
        components={{
          toolbar: CustomToolbar
        }}
        popup
        views={['month', 'week', 'agenda']}
      />
      
      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Subscription Details</h2>
              <button className="modal-close" onClick={() => setShowEventModal(false)}>×</button>
            </div>
            
            <div className="event-details">
              <h3>{selectedEvent.api.serviceName}</h3>
              
              {selectedEvent.category && (
                <div className="event-category" style={{ color: selectedEvent.category.color }}>
                  {selectedEvent.category.emoji} {selectedEvent.category.name}
                </div>
              )}
              
              <div className="event-info">
                <div className="info-row">
                  <label>Type:</label>
                  <span className={`event-type ${selectedEvent.type}`}>
                    {selectedEvent.type === 'renewal' ? '🔄 Renewal' : '⚠️ Expiry'}
                  </span>
                </div>
                
                <div className="info-row">
                  <label>Date:</label>
                  <span>{moment(selectedEvent.start).format('MMMM DD, YYYY')}</span>
                </div>
                
                {selectedEvent.api.subscriptionType === 'paid' && (
                  <>
                    <div className="info-row">
                      <label>Cost:</label>
                      <span>${selectedEvent.api.cost}/{selectedEvent.api.billingCycle}</span>
                    </div>
                    
                    {selectedEvent.api.autoRenews && (
                      <div className="info-row">
                        <label>Auto-renews:</label>
                        <span>Yes</span>
                      </div>
                    )}
                  </>
                )}
                
                <div className="info-row">
                  <label>Email:</label>
                  <span>{selectedEvent.api.email}</span>
                </div>
                
                {selectedEvent.api.website && (
                  <div className="info-row">
                    <label>Website:</label>
                    <a href={selectedEvent.api.website} target="_blank" rel="noopener noreferrer">
                      {selectedEvent.api.website}
                    </a>
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowEventModal(false)}
                >
                  Close
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    onEditAPI(selectedEvent.api);
                    setShowEventModal(false);
                  }}
                >
                  Edit Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;