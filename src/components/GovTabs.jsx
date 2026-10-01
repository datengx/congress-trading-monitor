import { useId, useState } from "react";

// GOV.UK Frontend tabs markup, driven by React state (the component's own JS is not loaded on this site).
export default function GovTabs({ tabs, title = "Contents" }) {
  const [active, setActive] = useState(0);
  const id = useId();
  return (
    // GOV.UK styles tabs as tabs only under .govuk-frontend-supported (set by its JS, which this site does not load).
    <div className="govuk-frontend-supported"><div className="govuk-tabs" data-module="govuk-tabs">
      <h2 className="govuk-tabs__title">{title}</h2>
      <ul className="govuk-tabs__list" role="tablist">
        {tabs.map((t, i) => (
          <li key={t.label} className={`govuk-tabs__list-item${i === active ? " govuk-tabs__list-item--selected" : ""}`} role="presentation">
            <a className="govuk-tabs__tab" href={`#${id}-${i}`} id={`${id}-tab-${i}`} role="tab" aria-controls={`${id}-${i}`} aria-selected={i === active} tabIndex={i === active ? 0 : -1}
              onClick={(e) => { e.preventDefault(); setActive(i); }}>{t.label}</a>
          </li>
        ))}
      </ul>
      {tabs.map((t, i) => (
        <div key={t.label} className={`govuk-tabs__panel${i === active ? "" : " govuk-tabs__panel--hidden"}`} id={`${id}-${i}`} role="tabpanel" aria-labelledby={`${id}-tab-${i}`}>
          {i === active && t.content}
        </div>
      ))}
    </div></div>
  );
}
