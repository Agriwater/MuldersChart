import { useEffect } from 'react';

const sections = [
  {
    title: '1. Acceptance Of Terms',
    body: [
      'By accessing, browsing, testing, or using this site, application, simulation, API, or any related AgriWater digital service made available through agriwater.earth, you agree to be bound by these Terms and Conditions. If you do not agree, do not use the site.',
      'These Terms apply to all visitors, customers, trial users, agents, contractors, and any party accessing the site or its outputs.',
    ],
  },
  {
    title: '2. Ownership, Copyright, And Intellectual Property',
    body: [
      'This site and all related content, software, interfaces, charts, visual layouts, simulation logic, workflows, documentation, text, graphics, branding, data structures, and associated materials are owned by AgriWater and controlled through agriwater.earth, unless expressly stated otherwise.',
      'Copyright in the site and its contents is claimed by agriwater.earth. All rights are reserved. No ownership rights are transferred to you by access or use.',
      'AgriWater retains all intellectual property rights, including rights in inventions, methods, systems, interfaces, designs, source code, know-how, trade secrets, and derivative works. Certain technologies, processes, features, and methods used in or associated with this site are patent pending. No licence is granted except the limited, revocable right to use the site for its intended purpose under these Terms.',
    ],
  },
  {
    title: '3. Limited Licence And Permitted Use',
    body: [
      'Subject to these Terms, AgriWater grants you a limited, non-exclusive, non-transferable, revocable licence to access and use the site for lawful internal evaluation, operational reference, and authorised customer use.',
      'You may not copy, republish, sell, sublicense, frame, mirror, exploit, or commercially reuse any portion of the site without prior written permission from AgriWater.',
    ],
  },
  {
    title: '4. Prohibited Conduct',
    body: [
      'You may not reverse engineer, decompile, disassemble, scrape at scale, benchmark for a competing product, bypass technical controls, interfere with the site, upload malicious code, remove proprietary notices, or use the site in any unlawful, misleading, or abusive manner.',
      'You may not use any output, model behaviour, chart logic, screenshots, branding, or documentation from this site to build, train, market, or support a competing service or product.',
    ],
  },
  {
    title: '5. Accounts, Access, And Suspension',
    body: [
      'If access credentials are issued, you are responsible for all activity under your account and for maintaining the confidentiality of your login details. You must notify AgriWater immediately of any suspected unauthorised access or misuse.',
      'AgriWater may suspend, restrict, or terminate access at any time where it reasonably believes there has been non-payment, misuse, security risk, legal exposure, attempted circumvention, infringement, or any breach of these Terms.',
    ],
  },
  {
    title: '6. Data, Inputs, And Feedback',
    body: [
      'You are responsible for the accuracy, legality, and permissions associated with any data, settings, inputs, or files you submit through the site. AgriWater may process submitted information as reasonably required to operate, secure, support, maintain, and improve the service.',
      'If you provide suggestions, comments, ideas, corrections, or feature requests, you grant AgriWater a perpetual, irrevocable, worldwide, royalty-free right to use them without restriction or compensation.',
    ],
  },
  {
    title: '7. No Professional, Engineering, Or Agronomic Advice',
    body: [
      'This site may include simulations, projections, nutrient relationships, recommendations, visualisations, or operational guidance. They are provided for general informational and technical support purposes only and do not constitute engineering, agronomic, legal, medical, financial, or regulatory advice.',
      'You remain solely responsible for verifying outputs independently and for all irrigation, agricultural, chemical, electrical, commercial, or operational decisions made using the site or its outputs.',
    ],
  },
  {
    title: '8. Disclaimers',
    body: [
      'The site is provided on an as-is and as-available basis. To the maximum extent permitted by law, AgriWater disclaims all warranties, whether express, implied, statutory, or otherwise, including warranties of accuracy, availability, merchantability, fitness for a particular purpose, non-infringement, uninterrupted operation, and error-free performance.',
      'AgriWater does not warrant that the site, data, charts, APIs, or outputs will be complete, current, secure, compatible with your environment, or suitable for your intended use.',
    ],
  },
  {
    title: '9. Limitation Of Liability',
    body: [
      'To the maximum extent permitted by law, AgriWater and its affiliates, officers, employees, contractors, licensors, and agents will not be liable for any indirect, incidental, consequential, special, punitive, or exemplary loss, including lost profits, crop loss, downtime, lost revenue, lost data, business interruption, procurement costs, or reputational harm arising from or related to the site.',
      'If liability cannot be excluded, AgriWater\'s aggregate liability arising out of or in connection with the site will not exceed the greater of the amount you paid directly to AgriWater for the specific service in the twelve months preceding the claim or USD 100.',
    ],
  },
  {
    title: '10. Indemnity',
    body: [
      'You agree to defend, indemnify, and hold harmless AgriWater, its affiliates, and their respective personnel from and against any claim, demand, loss, damage, liability, cost, or expense, including reasonable legal fees, arising from your use of the site, your data, your breach of these Terms, or your violation of any law or third-party right.',
    ],
  },
  {
    title: '11. Injunctive Relief',
    body: [
      'Because unauthorised use of AgriWater intellectual property may cause irreparable harm, AgriWater may seek immediate injunctive or equitable relief, in addition to any other available remedies, in any court of competent jurisdiction.',
    ],
  },
  {
    title: '12. Governing Law And Venue',
    body: [
      'These Terms and any non-contractual dispute arising from them are governed by the laws of the Republic of South Africa, excluding conflict-of-law rules. Any dispute not resolved informally will be submitted to the competent courts of South Africa, unless AgriWater elects another lawful forum for urgent protective relief.',
    ],
  },
  {
    title: '13. Changes To These Terms',
    body: [
      'AgriWater may update these Terms at any time by posting a revised version at this site. The updated version takes effect when published. Continued use after publication constitutes acceptance of the revised Terms.',
    ],
  },
  {
    title: '14. Contact',
    body: [
      'For legal notices, permissions, infringement complaints, or commercial enquiries related to the site, contact AgriWater through agriwater.earth or email info@agriwater.earth.',
    ],
  },
];

export default function TermsPage() {
  useEffect(() => {
    document.title = 'Terms and Conditions | AgriWater';
  }, []);

  return (
    <main className="legal-shell">
      <section className="legal-hero legal-card">
        <p className="eyebrow">Legal</p>
        <h1>Terms and Conditions</h1>
        <p className="legal-copy">
          These Terms govern use of this AgriWater site and related digital services. They are written to preserve
          AgriWater&apos;s ownership of the platform, its content, and its underlying technical methods.
        </p>
        <div className="legal-meta">
          <span>Effective date: 23 March 2026</span>
          <span>Owner and IP holder: agriwater.earth</span>
          <span>Patent status: Patent pending</span>
        </div>
      </section>

      <section className="legal-grid">
        <article className="legal-card legal-summary">
          <h2>Key Notices</h2>
          <ul>
            <li>AgriWater owns the site, its code, content, models, and related intellectual property.</li>
            <li>No copying, reverse engineering, resale, or competitive reuse is permitted without written consent.</li>
            <li>The site is provided as-is and must not be treated as professional agronomic or engineering advice.</li>
            <li>Certain AgriWater technologies and methods are patent pending.</li>
          </ul>
          <a className="ghost-button legal-link" href="/">
            Return to chart
          </a>
        </article>

        <div className="legal-sections">
          {sections.map((section) => (
            <article className="legal-card legal-section" key={section.title}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}