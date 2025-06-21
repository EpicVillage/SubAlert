declare module 'react-big-calendar' {
  import { Moment } from 'moment';
  import { ComponentType } from 'react';

  export type View = 'month' | 'week' | 'work_week' | 'day' | 'agenda';

  export interface Event {
    title?: string;
    start?: Date;
    end?: Date;
    allDay?: boolean;
    resource?: any;
  }

  export interface CalendarProps {
    localizer: any;
    events: Event[];
    startAccessor?: string | ((event: Event) => Date);
    endAccessor?: string | ((event: Event) => Date);
    titleAccessor?: string | ((event: Event) => string);
    allDayAccessor?: string | ((event: Event) => boolean);
    resourceAccessor?: string | ((event: Event) => any);
    resourceIdAccessor?: string | ((event: Event) => any);
    resourceTitleAccessor?: string | ((event: Event) => any);
    defaultView?: View;
    view?: View;
    views?: View[] | { [view in View]?: boolean };
    onView?: (view: View) => void;
    date?: Date;
    onNavigate?: (date: Date) => void;
    onSelectEvent?: (event: Event, e: React.SyntheticEvent<HTMLElement>) => void;
    onDoubleClickEvent?: (event: Event, e: React.SyntheticEvent<HTMLElement>) => void;
    onSelectSlot?: (slotInfo: { start: Date; end: Date; slots: Date[]; action: 'select' | 'click' | 'doubleClick' }) => void;
    eventPropGetter?: (event: Event, start: Date, end: Date, isSelected: boolean) => { style?: React.CSSProperties; className?: string };
    slotPropGetter?: (date: Date) => { style?: React.CSSProperties; className?: string };
    dayPropGetter?: (date: Date) => { style?: React.CSSProperties; className?: string };
    style?: React.CSSProperties;
    className?: string;
    popup?: boolean;
    toolbar?: boolean;
    components?: {
      toolbar?: ComponentType<any>;
      event?: ComponentType<any>;
      eventWrapper?: ComponentType<any>;
      dayWrapper?: ComponentType<any>;
      dateCellWrapper?: ComponentType<any>;
      timeSlotWrapper?: ComponentType<any>;
      month?: {
        header?: ComponentType<any>;
        dateHeader?: ComponentType<any>;
        event?: ComponentType<any>;
      };
      week?: {
        header?: ComponentType<any>;
        event?: ComponentType<any>;
      };
      day?: {
        header?: ComponentType<any>;
        event?: ComponentType<any>;
      };
    };
    formats?: any;
    messages?: any;
    timeslots?: number;
    step?: number;
    min?: Date;
    max?: Date;
    scrollToTime?: Date;
    showMultiDayTimes?: boolean;
    rtl?: boolean;
    culture?: string;
    drilldownView?: View | null;
    getDrilldownView?: (targetDate: Date, currentViewName: View, configuredViewNames: View[]) => View | null;
    length?: number;
  }

  export const Calendar: ComponentType<CalendarProps>;

  export function momentLocalizer(moment: any): any;
}