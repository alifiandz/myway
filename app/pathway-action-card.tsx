"use client";
import { Check } from "lucide-react";
export type PathwayActionCardProps = { requirement: string; value: string; source: string; effort: string; timing: string; why: string; done: boolean; onToggle: () => void };
export default function PathwayActionCard({ requirement, value, source, effort, timing, why, done, onToggle }: PathwayActionCardProps) {
  return <article className={`pathway-action-item ${done ? "done" : ""}`}>
    <button type="button" className="pathway-action-check" aria-label={`${done ? "Reopen" : "Complete"} ${requirement}`} aria-pressed={done} onClick={onToggle}><span className={`check ${done ? "checked" : ""}`}>{done && <Check size={13}/>}</span></button>
    <div className="pathway-action-copy"><strong>{requirement}</strong><p className="pathway-action-current">{value}</p><div className="pathway-action-meta"><span><b>Estimate</b> {effort}</span><span><b>When</b> {timing}</span></div><details className="pathway-action-explanation"><summary>Why & source</summary><p>{why}</p><p><b>Evidence source:</b> {source}</p></details></div>
    <button type="button" className="pathway-action-complete" onClick={onToggle}>{done ? "Completed" : "Mark complete"}</button>
  </article>;
}
