import React from "react";
import WeeklyFlows from "../components/WeeklyFlows";
import { SectionHeader } from "../ui";

// Charts that summarise the whole dataset over time. Kept off the overview, which reports the last 30 days, and off
// the Trades page, which is for searching individual disclosures.
export default function InsightsPage({ data }) {
  const { flows = [] } = data;
  return (
    <div className="govuk-width-container">
      <main className="govuk-main-wrapper" id="main-content">
        <div className="max-w-3xl">
          <h1 className="dk-h1">Insights</h1>
          <p className="govuk-body-l">Trends across every disclosed trade by members of Congress.</p>
        </div>
        {flows.length > 0 && (
          <section className="pb-8 mt-6" id="weekly-flows">
            <SectionHeader title="Stock trading by members of Congress" subtitle="Weekly purchases minus sales, alongside the S&P 500." />
            <WeeklyFlows flows={flows} />
          </section>
        )}
      </main>
    </div>
  );
}
