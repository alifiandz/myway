import { Check } from "lucide-react";

type Props = { dates: Date[]; title: string; language?: "en" | "id"; isChecked: (date: Date) => boolean; onToggle: (date: Date) => void };
export default function HabitMonthCalendar({ dates, title, language = "en", isChecked, onToggle }: Props) {
 const first = dates[0];
 if (!first) return null;
 const offset = (first.getDay() + 6) % 7;
 const locale = language === "id" ? "id-ID" : "en-GB";
 const weekdays = language === "id" ? ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
 return <div className="habit-month-calendar" role="group" aria-label={`${title}, ${first.toLocaleDateString(locale, {month:"long",year:"numeric"})}`}>
  <div className="habit-calendar-weekdays" aria-hidden="true">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
  <div className="habit-calendar-dates">
   {Array.from({length:offset},(_,i) => <span className="habit-calendar-empty" key={`empty-${i}`} aria-hidden="true"/>)}
   {dates.map(date => { const checked = isChecked(date); return <button type="button" key={date.getDate()} className={checked ? "checked" : ""} aria-pressed={checked} aria-label={`${title}, ${date.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"long",year:"numeric"})}`} onClick={() => onToggle(date)}><span>{date.getDate()}</span>{checked && <Check size={12} aria-hidden="true"/>}</button>; })}
  </div>
 </div>;
}
