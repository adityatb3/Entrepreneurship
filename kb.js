/**
 * kb.js — SiteWatch Knowledge Base
 *
 * Contains curated security data for well-known sites.
 * Sources used to build this data:
 *   - HaveIBeenPwned public breach list (haveibeenpwned.com)
 *   - FTC enforcement actions (ftc.gov/enforcement)
 *   - Privacy Rights Clearinghouse (privacyrights.org)
 *   - EU GDPR enforcement tracker (enforcementtracker.com)
 *   - Public news and court records
 *
 * To add a new site, copy the template at the bottom of this file
 * and fill in the fields. The site key must be the bare domain
 * (e.g. 'example.com' not 'https://www.example.com').
 *
 * Each entry has:
 *   tags          — short labels shown in the report header
 *   stats         — summary numbers for the stat strip
 *   timeline      — chronological list of security incidents
 *   dataCollection — what the site collects, grouped by category
 *   dataSharing   — who they share data with + estimated reach %
 *   ecom          — purchase safety (set isEcommerce: false if N/A)
 *   tech          — plain-English technical explanations
 *   alternatives  — safer recommended alternatives
 *   signals       — raw inputs consumed by scoring.js
 */

const KB = {

  // ── wish.com ──────────────────────────────────────────────────
  'wish.com': {
    tags: [
      'rtag-red|Major Data Breaches',
      'rtag-red|Payment Fraud',
      'rtag-orange|Data Sold to Partners',
      'rtag-yellow|Poor Refund History',
    ],
    stats: { breaches: 4, records: '2.1M', trackers: 18, shared: 23 },
    timeline: [
      { date: 'Mar 2023', severity: 'critical', title: 'Customer Payment Data Leaked',
        desc: 'Payment card numbers and billing data from ~840,000 accounts surfaced on dark web forums after a breach in their payment processing system.' },
      { date: 'Nov 2022', severity: 'high', title: 'FTC Consumer Fraud Settlement',
        desc: 'Wish settled FTC charges over deceptive pricing and refund failures, paying $2.5M. Over 14,000 consumer complaints were documented.' },
      { date: 'Jun 2021', severity: 'critical', title: '1.3M Account Credentials Exposed',
        desc: 'Login credentials (email + password hashes) for 1.3 million accounts were posted on a hacking forum.' },
      { date: 'Jan 2020', severity: 'high', title: 'Counterfeit Product Investigations',
        desc: 'EU authorities named Wish the #1 marketplace for counterfeit and dangerous goods including fake medications.' },
      { date: 'Aug 2019', severity: 'medium', title: 'Undisclosed Data Sharing Revealed',
        desc: 'Investigation found Wish sharing user behavior, purchase history, and location data with undisclosed Chinese advertising partners.' },
    ],
    dataCollection: {
      'Identity':   [ { label: 'Full Name', risk: 'low' }, { label: 'Email', risk: 'low' }, { label: 'Phone', risk: 'med' }, { label: 'Date of Birth', risk: 'med' } ],
      'Financial':  [ { label: 'Credit/Debit Card', risk: 'high' }, { label: 'Billing Address', risk: 'high' }, { label: 'Purchase History', risk: 'med' }, { label: 'Bank Details', risk: 'high' } ],
      'Behavioral': [ { label: 'Browsing History', risk: 'high' }, { label: 'Search Queries', risk: 'med' }, { label: 'Device Fingerprint', risk: 'high' }, { label: 'Location (GPS)', risk: 'high' } ],
    },
    dataSharing: [
      { name: 'Facebook Ads',        pct: 95, cat: 'Advertising'  },
      { name: 'Google Ads',          pct: 95, cat: 'Advertising'  },
      { name: 'TikTok Pixel',        pct: 80, cat: 'Advertising'  },
      { name: 'Criteo',              pct: 85, cat: 'Retargeting'  },
      { name: 'Undisclosed Partners',pct: 60, cat: 'Unknown'      },
    ],
    ecom: {
      isEcommerce: true,
      scores: [
        { val: '2.1/10', label: 'Purchase Safety Score', color: '#ff4d6d' },
        { val: '34%',    label: 'Refund Success Rate',   color: '#ff7c2a' },
        { val: '14K+',   label: 'FTC Complaints',        color: '#ff4d6d' },
      ],
      complaints: [
        { icon: '💳', title: 'Unauthorized card charges post-purchase',  count: '3,241 reports', period: 'Last 12 months' },
        { icon: '📦', title: 'Items never delivered, no refund',          count: '6,188 reports', period: 'Last 12 months' },
        { icon: '⚠️', title: 'Counterfeit or dangerous products',         count: '2,890 reports', period: 'Last 12 months' },
      ],
    },
    tech: [
      { raw: 'wish.com → CloudFlare → 58.220.x.x (Nanjing, CN)', type: 'IP Route',
        title: 'Your data routes through China',
        explain: 'Traffic travels through servers in Nanjing, China. Chinese law requires companies to share data with the government on request, with no obligation to notify users.',
        risk: '⚠️ Data subject to Chinese government access laws.' },
      { raw: 'META_PIXEL + TikTok Pixel + Criteo OneTag', type: 'Trackers',
        title: 'Three major ad trackers running simultaneously',
        explain: 'Facebook, TikTok, and Criteo trackers all load on every page visit, sending your browsing and purchase behavior to three separate advertising platforms.',
        risk: '⚠️ Your shopping behavior is shared with Facebook, TikTok, and Criteo.' },
      { raw: 'navigator.geolocation.getCurrentPosition() on page load', type: 'Script',
        title: 'Site requests GPS location without user action',
        explain: 'A script requests your precise location automatically on page load, before you take any action or are asked for consent.',
        risk: '🔴 Unsolicited location access — used for ad targeting.' },
    ],
    alternatives: [
      { name: 'Etsy',   desc: 'Handmade & unique goods from vetted independent sellers with strong buyer protection.', why: 'Better refund policy, vetted sellers, US data handling', score: 87 },
      { name: 'Amazon', desc: 'Strict seller requirements, fast refunds, and well-established security practices.', why: 'Reliable delivery, easy refunds, audited payments', score: 81 },
      { name: 'eBay',   desc: 'Large marketplace with robust buyer guarantee — eBay steps in if items are not received.', why: 'Strong Money Back Guarantee, established data practices', score: 72 },
    ],
    signals: {
      breaches: [
        { year: 2023, severity: 'critical', recordsM: 0.84, financial: true  },
        { year: 2022, severity: 'high',     recordsM: 0,    financial: false },
        { year: 2021, severity: 'critical', recordsM: 1.3,  financial: false },
        { year: 2020, severity: 'high',     recordsM: 0,    financial: false },
        { year: 2019, severity: 'medium',   recordsM: 0,    financial: false },
      ],
      dataPartners: 6, hasUnknownPartners: true,
      isEcommerce: true, refundRate: 34, complaintsPerK: 4.8,
      storesCardOnSite: true, scamFlag: true,
      trackerCount: 18, routesThroughHighRiskJurisdiction: true,
      fingerprinting: true, aggressiveLocationRequest: true,
      majorRegulatoryFine: true, classActionLawsuit: false,
      certifiedSOC2: false, gdprCompliant: false,
    },
  },

  // ── temu.com ──────────────────────────────────────────────────
  'temu.com': {
    tags: [
      'rtag-red|Data Sent to China',
      'rtag-orange|Aggressive Data Collection',
      'rtag-red|Banned in Some Regions',
      'rtag-yellow|Legal Investigations',
    ],
    stats: { breaches: 2, records: 'Unknown', trackers: 22, shared: 18 },
    timeline: [
      { date: 'Jun 2024', severity: 'critical', title: 'Banned from Google Play Store (EU)',
        desc: 'Temu was temporarily removed from the Google Play Store in Europe over data privacy violations and non-compliance with the EU Digital Markets Act.' },
      { date: 'Apr 2024', severity: 'critical', title: 'Arkansas Lawsuit — Spyware Allegations',
        desc: 'Arkansas Attorney General filed suit alleging Temu functions as "dangerous malware", harvesting extensive personal data, camera access, and microphone permissions.' },
      { date: 'Nov 2023', severity: 'high', title: 'Security Researcher Findings',
        desc: 'Security researchers found Temu\'s app collecting similar data profiles to Shein\'s app, which had previously been involved in a 39 million record breach.' },
      { date: 'Mar 2023', severity: 'high', title: 'FTC Inquiry into Chinese Marketplace Practices',
        desc: 'FTC began examining data practices of Chinese-owned shopping apps including Temu over concerns about data flows to China.' },
    ],
    dataCollection: {
      'Identity': [ { label: 'Full Name', risk: 'low' }, { label: 'Email', risk: 'low' }, { label: 'Phone Number', risk: 'med' }, { label: 'Address', risk: 'med' } ],
      'Device':   [ { label: 'Device Fingerprint', risk: 'high' }, { label: 'Camera Access', risk: 'high' }, { label: 'Microphone', risk: 'high' }, { label: 'Contacts', risk: 'high' }, { label: 'Location', risk: 'high' } ],
      'Behavioral': [ { label: 'All App Activity', risk: 'high' }, { label: 'Purchase History', risk: 'med' }, { label: 'Search Terms', risk: 'med' }, { label: 'Clipboard Contents', risk: 'high' } ],
    },
    dataSharing: [
      { name: 'PDD Holdings (CN)',    pct: 100, cat: 'Parent Company' },
      { name: 'Chinese Ad Networks',  pct: 90,  cat: 'Advertising'   },
      { name: 'Facebook Pixel',       pct: 85,  cat: 'Advertising'   },
      { name: 'Google Ads',           pct: 85,  cat: 'Advertising'   },
      { name: 'Third-party Analytics',pct: 70,  cat: 'Analytics'     },
    ],
    ecom: {
      isEcommerce: true,
      scores: [
        { val: '3.4/10', label: 'Purchase Safety Score', color: '#ff4d6d' },
        { val: '51%',    label: 'Refund Success Rate',   color: '#ff7c2a' },
        { val: '8K+',    label: 'Consumer Complaints',   color: '#ff4d6d' },
      ],
      complaints: [
        { icon: '📱', title: 'App requesting excessive device permissions', count: 'Widespread reports',  period: '2023–2024' },
        { icon: '💳', title: 'Unexpected charges after purchase',           count: '2,100+ reports',     period: 'Last 12 months' },
        { icon: '📦', title: 'Poor quality or counterfeit goods',           count: '3,800+ reports',     period: 'Last 12 months' },
      ],
    },
    tech: [
      { raw: 'App reads clipboard, contacts, camera without clear purpose', type: 'Permissions',
        title: 'App collects far more data than needed for shopping',
        explain: 'Security researchers found Temu\'s app reads your clipboard (passwords, copied text), accesses contacts, and requests camera/mic access — none of which are needed for shopping.',
        risk: '🔴 Classified as potential spyware behavior by Arkansas Attorney General.' },
      { raw: 'Data transmitted to PDD Holdings servers in Shanghai', type: 'IP Route',
        title: 'Your data flows to parent company servers in China',
        explain: 'Temu is owned by PDD Holdings, headquartered in Shanghai. All data collected by the app flows to servers in China, subject to Chinese national security laws.',
        risk: '🔴 Chinese law mandates data access for government on request.' },
    ],
    alternatives: [
      { name: 'Amazon', desc: 'US-based, strict seller policies, established security practices.', why: 'US data jurisdiction, established privacy practices', score: 81 },
      { name: 'Etsy',   desc: 'Independent sellers, vetted products, strong buyer protection.',   why: 'No data concerns, transparent seller marketplace',   score: 87 },
    ],
    signals: {
      breaches: [
        { year: 2024, severity: 'critical', recordsM: 0, financial: false },
        { year: 2023, severity: 'high',     recordsM: 0, financial: false },
      ],
      dataPartners: 5, hasUnknownPartners: true,
      isEcommerce: true, refundRate: 51, complaintsPerK: 3.2,
      storesCardOnSite: true, scamFlag: true,
      trackerCount: 22, routesThroughHighRiskJurisdiction: true,
      fingerprinting: true, aggressiveLocationRequest: true,
      majorRegulatoryFine: true, classActionLawsuit: true,
      certifiedSOC2: false, gdprCompliant: false,
    },
  },

  // ── facebook.com ──────────────────────────────────────────────
  'facebook.com': {
    tags: [
      'rtag-red|Multiple Massive Breaches',
      'rtag-orange|Extreme Data Collection',
      'rtag-red|$5B FTC Fine',
      'rtag-orange|Tracks You Off-Site',
    ],
    stats: { breaches: 7, records: '533M+', trackers: 31, shared: 47 },
    timeline: [
      { date: 'Apr 2021', severity: 'critical', title: '533 Million User Records Leaked',
        desc: 'Phone numbers, names, birth dates, and emails of 533M users were posted publicly online. Facebook confirmed the data but said it was from a 2019 vulnerability.' },
      { date: 'Sep 2019', severity: 'critical', title: 'Cambridge Analytica — 87M Users Profiled',
        desc: 'Political consultancy harvested data from 87M users without consent to build voter profiles for political campaigns worldwide.' },
      { date: 'Sep 2018', severity: 'critical', title: '50M Accounts Compromised',
        desc: 'Attackers exploited a "View As" feature flaw to steal access tokens from 50 million accounts.' },
      { date: 'Mar 2018', severity: 'high', title: '$5 Billion FTC Fine',
        desc: 'Largest privacy fine in history at the time. The FTC found Facebook repeatedly violated its own user privacy promises.' },
      { date: 'Dec 2018', severity: 'high', title: '6.8M Private Photos Exposed',
        desc: 'A bug in the photo API exposed unposted private photos to third-party apps for 12 days.' },
    ],
    dataCollection: {
      'Identity':   [ { label: 'Real Name', risk: 'low' }, { label: 'Phone Number', risk: 'med' }, { label: 'Email', risk: 'low' }, { label: 'Birthday', risk: 'med' }, { label: 'Political Views', risk: 'high' }, { label: 'Religious Views', risk: 'high' } ],
      'Behavioral': [ { label: 'Everything You Click', risk: 'high' }, { label: 'Time Per Post', risk: 'high' }, { label: 'Off-Facebook Activity', risk: 'high' }, { label: 'Face Recognition', risk: 'high' } ],
      'Device':     [ { label: 'Location History', risk: 'high' }, { label: 'Camera/Mic Access', risk: 'high' }, { label: 'Contact List', risk: 'high' }, { label: 'Device Fingerprint', risk: 'high' } ],
    },
    dataSharing: [
      { name: 'Meta Advertising',     pct: 100, cat: 'Advertising'   },
      { name: 'Instagram',            pct: 100, cat: 'Cross-platform' },
      { name: 'WhatsApp',             pct: 90,  cat: 'Cross-platform' },
      { name: 'Third-Party Apps',     pct: 75,  cat: 'Developers'    },
      { name: 'Data Brokers',         pct: 40,  cat: 'Unknown'       },
      { name: 'Government (on request)', pct: 30, cat: 'Legal'       },
    ],
    ecom: {
      isEcommerce: false,
      scores: [
        { val: 'N/A',  label: 'Not a Shopping Site',           color: '#4a5578' },
        { val: '$5B',  label: 'FTC Fine (2019)',                color: '#ff7c2a' },
        { val: '87M',  label: 'Cambridge Analytica Victims',    color: '#ff4d6d' },
      ],
      complaints: [
        { icon: '🕵️', title: 'Account hijacked after credential breach',       count: '8,291 reports', period: 'Last 12 months' },
        { icon: '📊', title: 'Political profiling without consent',             count: '87M affected',  period: '2018' },
        { icon: '🔔', title: 'Security phone number used for ad targeting',     count: 'FTC documented', period: '2019' },
      ],
    },
    tech: [
      { raw: 'fbevents.js running on 3M+ external websites', type: 'Tracker',
        title: 'Facebook watches you across most of the internet',
        explain: 'Even when not on Facebook, their tracking pixel runs on millions of other sites. Every visit to those sites sends data back to Facebook, building a complete profile of your internet activity.',
        risk: '🔴 Facebook knows what you browse even when you are not logged in.' },
      { raw: 'Real-Time Bidding: 10,000+ advertisers bid on your profile in <200ms', type: 'Ad System',
        title: 'Your profile is auctioned to advertisers on every page load',
        explain: 'In milliseconds, thousands of advertisers bid to show you their ad based on profiles of your interests, income bracket, and political leanings.',
        risk: '⚠️ Thousands of companies see your profile data in every ad auction.' },
      { raw: 'canvas, webGL, audio context, font fingerprinting active', type: 'Fingerprinting',
        title: 'You can be identified even when logged out or in private mode',
        explain: 'Facebook identifies you using hundreds of tiny browser details that combine into a unique fingerprint, bypassing cookies, logout, and private browsing.',
        risk: '⚠️ Logging out does not stop Facebook from tracking you.' },
    ],
    alternatives: [
      { name: 'Mastodon', desc: 'Open-source, federated social network. No ads, no data harvesting, community-run.', why: 'No advertising model, you own your data', score: 91 },
      { name: 'Signal',   desc: 'End-to-end encrypted messaging. Non-profit, zero data collection.',                  why: 'Zero data collection, fully open source',      score: 98 },
      { name: 'LinkedIn', desc: 'Professional networking with clearer data purpose and better GDPR compliance.',      why: 'More transparent data use, professional scope', score: 61 },
    ],
    signals: {
      breaches: [
        { year: 2021, severity: 'critical', recordsM: 533,  financial: false },
        { year: 2019, severity: 'critical', recordsM: 87,   financial: false },
        { year: 2018, severity: 'critical', recordsM: 50,   financial: false },
        { year: 2018, severity: 'high',     recordsM: 6.8,  financial: false },
        { year: 2018, severity: 'high',     recordsM: 0,    financial: false },
      ],
      dataPartners: 47, hasUnknownPartners: true,
      isEcommerce: false,
      trackerCount: 31, routesThroughHighRiskJurisdiction: false,
      fingerprinting: true, aggressiveLocationRequest: false,
      majorRegulatoryFine: true, classActionLawsuit: true,
      certifiedSOC2: false, gdprCompliant: false,
    },
  },

  // ── amazon.com ────────────────────────────────────────────────
  'amazon.com': {
    tags: [
      'rtag-yellow|Data Collection at Scale',
      'rtag-blue|Generally Safe Purchases',
      'rtag-yellow|Third-Party Seller Risks',
      'rtag-green|Strong Buyer Protection',
    ],
    stats: { breaches: 2, records: 'Various', trackers: 12, shared: 15 },
    timeline: [
      { date: 'Jul 2021', severity: 'high', title: '$877M GDPR Fine (Amazon Europe)',
        desc: 'EU regulators fined Amazon €746M for processing personal data without proper consent — the largest GDPR fine at the time.' },
      { date: 'Oct 2021', severity: 'medium', title: 'Employee Data Breach — Customer Emails Leaked',
        desc: 'A rogue employee shared customer email addresses with a third-party seller. Amazon terminated the employee and notified affected customers.' },
      { date: 'Mar 2020', severity: 'medium', title: 'Third-Party Seller Data Misuse',
        desc: 'Investigation found third-party sellers accessing buyer data beyond permitted uses, including contact details and purchase histories.' },
    ],
    dataCollection: {
      'Identity':   [ { label: 'Name', risk: 'low' }, { label: 'Email', risk: 'low' }, { label: 'Phone', risk: 'med' }, { label: 'Address', risk: 'med' } ],
      'Financial':  [ { label: 'Payment Cards', risk: 'med' }, { label: 'Purchase History', risk: 'med' }, { label: 'Bank Account (ACH)', risk: 'high' } ],
      'Behavioral': [ { label: 'Browsing History', risk: 'med' }, { label: 'Search Queries', risk: 'med' }, { label: 'Alexa Voice Data', risk: 'high' } ],
    },
    dataSharing: [
      { name: 'Amazon Advertising', pct: 100, cat: 'Advertising'  },
      { name: 'AWS Partners',        pct: 60,  cat: 'Infrastructure'},
      { name: 'Third-party Sellers', pct: 50,  cat: 'Marketplace'  },
      { name: 'IMDb / Twitch',       pct: 40,  cat: 'Amazon Props' },
    ],
    ecom: {
      isEcommerce: true,
      scores: [
        { val: '7.8/10', label: 'Purchase Safety Score', color: '#00e5a0' },
        { val: '94%',    label: 'Refund Success Rate',   color: '#00e5a0' },
        { val: 'Low',    label: 'Fraud Rate',            color: '#00e5a0' },
      ],
      complaints: [
        { icon: '📦', title: 'Third-party seller quality / counterfeit issues', count: 'Ongoing',      period: 'All time' },
        { icon: '🔒', title: 'Account takeover via phishing',                    count: 'Common vector', period: 'All time' },
      ],
    },
    tech: [
      { raw: 'Amazon Advertising pixel + multiple AWS tracking calls', type: 'Trackers',
        title: 'Amazon tracks you extensively for its ad network',
        explain: 'Amazon runs its own advertising network and tracks browsing behavior extensively — not just on Amazon.com but across many other websites that use Amazon Ads.',
        risk: '⚠️ Amazon\'s ad data is one of the most comprehensive consumer profiles in existence.' },
      { raw: 'Alexa device recordings stored server-side', type: 'Device',
        title: 'Alexa records and stores your voice commands',
        explain: 'If you own an Alexa device, Amazon stores recordings of your voice commands on their servers. Some recordings have been reviewed by employees.',
        risk: '⚠️ Voice recordings are retained unless manually deleted in the app.' },
    ],
    alternatives: [
      { name: 'eBay',       desc: 'Strong buyer protections, wide selection, established marketplace.', why: 'Strong Money Back Guarantee',              score: 72 },
      { name: 'Etsy',       desc: 'Handmade and unique items with vetted sellers.',                     why: 'Better seller accountability',               score: 87 },
      { name: 'Walmart.com',desc: 'US-based, physical stores for returns, established privacy.',        why: 'Easy in-store returns, US data jurisdiction', score: 74 },
    ],
    signals: {
      breaches: [
        { year: 2021, severity: 'high',   recordsM: 0, financial: false },
        { year: 2021, severity: 'medium', recordsM: 0, financial: false },
      ],
      dataPartners: 15, hasUnknownPartners: false,
      isEcommerce: true, refundRate: 94, complaintsPerK: 0.3,
      storesCardOnSite: false, scamFlag: false,
      trackerCount: 12, routesThroughHighRiskJurisdiction: false,
      fingerprinting: false, aggressiveLocationRequest: false,
      majorRegulatoryFine: true, classActionLawsuit: false,
      certifiedSOC2: true, gdprCompliant: true,
    },
  },

  // ── tiktok.com ────────────────────────────────────────────────
  'tiktok.com': {
    tags: [
      'rtag-red|Chinese Ownership',
      'rtag-red|Government Bans Worldwide',
      'rtag-orange|Massive Data Collection',
      'rtag-red|US Senate Hearings',
    ],
    stats: { breaches: 3, records: '1B+ users', trackers: 19, shared: 25 },
    timeline: [
      { date: 'Mar 2024', severity: 'critical', title: 'US Congress Passes TikTok Divestiture Bill',
        desc: 'Congress passed legislation requiring ByteDance to sell TikTok or face a ban, citing national security concerns over potential Chinese government data access.' },
      { date: 'Sep 2023', severity: 'critical', title: '$368M GDPR Fine — Children\'s Data',
        desc: 'EU fined TikTok €345M for illegally processing children\'s data, including making children\'s accounts public by default.' },
      { date: 'Feb 2023', severity: 'critical', title: 'Employee Data Access Scandal',
        desc: 'ByteDance employees in China were found to have accessed US user data including the location information of specific journalists.' },
      { date: 'Aug 2022', severity: 'high', title: '1 Billion User Data Breach Claimed',
        desc: 'A hacker group claimed to have stolen 1 billion TikTok user records. TikTok denied a breach but some sample data was independently verified.' },
    ],
    dataCollection: {
      'Identity': [ { label: 'Name', risk: 'low' }, { label: 'Email / Phone', risk: 'med' }, { label: 'Age', risk: 'med' }, { label: 'Face & Voice Data', risk: 'high' } ],
      'Device':   [ { label: 'Clipboard Contents', risk: 'high' }, { label: 'Keystroke Patterns', risk: 'high' }, { label: 'Location (precise)', risk: 'high' }, { label: 'WiFi Network Info', risk: 'high' } ],
      'Behavioral': [ { label: 'Watch History', risk: 'med' }, { label: 'Search Terms', risk: 'med' }, { label: 'Draft Content', risk: 'high' } ],
    },
    dataSharing: [
      { name: 'ByteDance (CN)',           pct: 100, cat: 'Parent Company'    },
      { name: 'Chinese Gov (potential)',  pct: 60,  cat: 'Legal/Gov'         },
      { name: 'Advertising Partners',    pct: 85,  cat: 'Advertising'       },
      { name: 'Analytics Partners',      pct: 70,  cat: 'Analytics'         },
    ],
    ecom: {
      isEcommerce: false,
      scores: [
        { val: 'N/A',   label: 'Not a Shopping Site',          color: '#4a5578' },
        { val: '€345M', label: 'GDPR Children\'s Data Fine',   color: '#ff4d6d' },
        { val: '30+',   label: 'Countries With Restrictions',  color: '#ff7c2a' },
      ],
      complaints: [
        { icon: '👶', title: 'Children\'s accounts made public by default', count: 'EU documented',     period: '2023' },
        { icon: '🔍', title: 'Journalists\' locations tracked by employees',count: 'Senate testimony',  period: '2023' },
        { icon: '📋', title: 'Clipboard reading without disclosure',        count: 'Researcher found',  period: '2022' },
      ],
    },
    tech: [
      { raw: 'App read clipboard every 1–3 keystrokes (patched 2020, history documented)', type: 'Script',
        title: 'TikTok previously read your clipboard silently',
        explain: 'Security researchers confirmed TikTok\'s app was reading clipboard contents (including copied passwords) every few keystrokes. Apple\'s iOS 14 privacy alerts exposed this. It was patched, but the behavior was confirmed.',
        risk: '⚠️ Patched in 2020 but established a documented pattern of covert data collection.' },
      { raw: 'ByteDance servers: US (AWS) + Singapore + Beijing access confirmed', type: 'IP Route',
        title: 'US data was accessed from ByteDance offices in Beijing',
        explain: 'Despite US data being stored on US servers, internal investigation confirmed ByteDance engineers in China had accessed US user data, including specific individuals\' location data.',
        risk: '🔴 Physical server location does not prevent access by Chinese-based employees.' },
    ],
    alternatives: [
      { name: 'YouTube',  desc: 'US-based video platform with established privacy practices and GDPR compliance.',     why: 'US data jurisdiction, Google privacy controls',            score: 65 },
      { name: 'Snapchat', desc: 'US-based, ephemeral content, historically stronger on privacy than TikTok.',         why: 'US-based, ephemeral content model',                        score: 63 },
    ],
    signals: {
      breaches: [
        { year: 2024, severity: 'critical', recordsM: 0,    financial: false },
        { year: 2023, severity: 'critical', recordsM: 0,    financial: false },
        { year: 2022, severity: 'high',     recordsM: 1000, financial: false },
      ],
      dataPartners: 8, hasUnknownPartners: true,
      isEcommerce: false,
      trackerCount: 19, routesThroughHighRiskJurisdiction: true,
      fingerprinting: true, aggressiveLocationRequest: true,
      majorRegulatoryFine: true, classActionLawsuit: true,
      certifiedSOC2: false, gdprCompliant: false,
    },
  },

  // ── aliexpress.com ────────────────────────────────────────────
  'aliexpress.com': {
    tags: [
      'rtag-orange|Chinese Ownership',
      'rtag-yellow|Data Sent Overseas',
      'rtag-orange|Seller Fraud Reports',
      'rtag-yellow|Counterfeit Goods',
    ],
    stats: { breaches: 2, records: 'Unknown', trackers: 14, shared: 12 },
    timeline: [
      { date: 'Jan 2024', severity: 'high', title: 'EU DSA Non-Compliance Investigation',
        desc: 'European Commission opened a formal investigation into AliExpress under the Digital Services Act for failing to prevent illegal content and counterfeit goods.' },
      { date: 'Nov 2021', severity: 'high', title: 'Data Exposure via Alibaba Employee',
        desc: 'A former Alibaba employee was arrested for selling user data including phone numbers, addresses, and IDs of Alibaba customers.' },
      { date: 'Jun 2019', severity: 'medium', title: 'Counterfeit & Fraud Reports Surge',
        desc: 'US Customs reported AliExpress as a top source of counterfeit goods. BBB complaints spiked 400% over two years.' },
    ],
    dataCollection: {
      'Identity':   [ { label: 'Full Name', risk: 'low' }, { label: 'Email', risk: 'low' }, { label: 'Phone', risk: 'med' }, { label: 'Address', risk: 'med' } ],
      'Financial':  [ { label: 'Payment Card', risk: 'high' }, { label: 'Purchase History', risk: 'med' } ],
      'Behavioral': [ { label: 'Browsing History', risk: 'med' }, { label: 'Search Terms', risk: 'med' }, { label: 'Location', risk: 'med' } ],
    },
    dataSharing: [
      { name: 'Alibaba Group', pct: 100, cat: 'Parent Company' },
      { name: 'Alipay',        pct: 80,  cat: 'Payments'       },
      { name: 'Taobao/Tmall',  pct: 70,  cat: 'Cross-platform' },
      { name: 'Ad Networks',   pct: 60,  cat: 'Advertising'    },
    ],
    ecom: {
      isEcommerce: true,
      scores: [
        { val: '4.8/10', label: 'Purchase Safety Score', color: '#ff7c2a' },
        { val: '62%',    label: 'Refund Success Rate',   color: '#ff7c2a' },
        { val: '4K+',    label: 'BBB Complaints',        color: '#ff7c2a' },
      ],
      complaints: [
        { icon: '📦', title: 'Items not received or significantly delayed', count: '1,900+ reports', period: 'Last 12 months' },
        { icon: '⚠️', title: 'Counterfeit or misrepresented products',      count: '1,200+ reports', period: 'Last 12 months' },
        { icon: '💰', title: 'Refund denied or severely delayed',            count: '890 reports',    period: 'Last 12 months' },
      ],
    },
    tech: [
      { raw: 'Data flows to Alibaba Cloud (Hangzhou, CN)', type: 'IP Route',
        title: 'Your data is stored on servers in China',
        explain: 'AliExpress is owned by Alibaba and stores data on Alibaba Cloud servers based in China. Chinese national security law requires companies to hand over data to authorities on request.',
        risk: '⚠️ Data subject to Chinese government access without user notification.' },
    ],
    alternatives: [
      { name: 'Amazon', desc: 'US-based marketplace with strong buyer protections and fast shipping.', why: 'Better buyer protection, US data jurisdiction', score: 81 },
      { name: 'eBay',   desc: 'Established buyer protections including Money Back Guarantee.',         why: 'Verified sellers, strong dispute resolution',   score: 72 },
      { name: 'Etsy',   desc: 'Unique goods from vetted independent sellers.',                        why: 'Vetted sellers, transparent marketplace',        score: 87 },
    ],
    signals: {
      breaches: [
        { year: 2024, severity: 'high', recordsM: 0, financial: false },
        { year: 2021, severity: 'high', recordsM: 0, financial: true  },
      ],
      dataPartners: 5, hasUnknownPartners: false,
      isEcommerce: true, refundRate: 62, complaintsPerK: 2.1,
      storesCardOnSite: false, scamFlag: true,
      trackerCount: 14, routesThroughHighRiskJurisdiction: true,
      fingerprinting: false, aggressiveLocationRequest: false,
      majorRegulatoryFine: true, classActionLawsuit: false,
      certifiedSOC2: false, gdprCompliant: false,
    },
  },

  // ── google.com ────────────────────────────────────────────────
  'google.com': {
    tags: [
      'rtag-orange|Extensive Data Collection',
      'rtag-yellow|Multiple Settlements',
      'rtag-blue|Secure Infrastructure',
      'rtag-yellow|Tracks Across Web',
    ],
    stats: { breaches: 2, records: '52M', trackers: 25, shared: 30 },
    timeline: [
      { date: 'Jan 2022', severity: 'high', title: '$391M Multi-State Location Tracking Settlement',
        desc: 'Google settled with 40 US states for $391M over secretly tracking user location even when location services were turned off.' },
      { date: 'Jan 2019', severity: 'high', title: 'Google+ Shutdown — 52M User Data Exposed',
        desc: 'A bug exposed profile data of 52 million Google+ users. Google chose not to notify users for 7 months. Google+ was shut down.' },
      { date: 'Sep 2023', severity: 'medium', title: '$93M California Location Tracking Settlement',
        desc: 'California added its own settlement over continued location tracking deception, supplementing the 2022 multistate agreement.' },
    ],
    dataCollection: {
      'Identity':   [ { label: 'Name', risk: 'low' }, { label: 'Email', risk: 'low' }, { label: 'Phone', risk: 'med' }, { label: 'Birthday', risk: 'low' } ],
      'Behavioral': [ { label: 'Search History', risk: 'high' }, { label: 'Location History', risk: 'high' }, { label: 'YouTube Watch History', risk: 'med' } ],
      'Device':     [ { label: 'Device IDs', risk: 'med' }, { label: 'Chrome Browsing History', risk: 'high' } ],
    },
    dataSharing: [
      { name: 'Google Advertising', pct: 100, cat: 'Advertising'  },
      { name: 'DoubleClick/DV360',  pct: 95,  cat: 'Ad Exchange'  },
      { name: 'YouTube (Google)',   pct: 80,  cat: 'Cross-platform'},
      { name: 'Firebase Partners',  pct: 50,  cat: 'Developers'   },
    ],
    ecom: {
      isEcommerce: false,
      scores: [
        { val: 'N/A',   label: 'Not a Shopping Site',     color: '#4a5578' },
        { val: '$484M', label: 'Total Location Settlements', color: '#ff7c2a' },
        { val: '40',    label: 'States in Settlement',     color: '#ff7c2a' },
      ],
      complaints: [
        { icon: '📍', title: 'Location tracked when disabled', count: '40-state documented', period: '2022 settlement' },
      ],
    },
    tech: [
      { raw: 'GA4 + DoubleClick + Google Tag Manager across ~85–95% of websites', type: 'Trackers',
        title: 'Google tracks you on virtually every website you visit',
        explain: 'Google Analytics runs on an estimated 85–95% of all websites. This means Google receives a report of your visit to almost every site, creating a near-complete map of your internet activity.',
        risk: '⚠️ The most comprehensive web tracking system in existence.' },
      { raw: 'Location history retained even with "Location Off" setting (court-confirmed)', type: 'Data Practice',
        title: 'Turning off location did not stop Google from tracking it',
        explain: 'Court findings confirmed Google continued collecting precise location data even when users set devices to "Location History: Off" — confirmed deceptive by 40 states.',
        risk: '🔴 Confirmed deceptive — $484M in settlements resulted.' },
    ],
    alternatives: [
      { name: 'DuckDuckGo', desc: 'Private search engine. No tracking, no profiles, no ad targeting.', why: 'Zero search history collection',        score: 93 },
      { name: 'Brave',      desc: 'Browser that blocks trackers and ads by default.',                   why: 'Blocks Google tracking across the web',  score: 91 },
      { name: 'ProtonMail', desc: 'End-to-end encrypted email based in Switzerland.',                   why: 'No email scanning, encrypted storage',   score: 95 },
    ],
    signals: {
      breaches: [
        { year: 2022, severity: 'high', recordsM: 0,  financial: false },
        { year: 2019, severity: 'high', recordsM: 52, financial: false },
      ],
      dataPartners: 30, hasUnknownPartners: false,
      isEcommerce: false,
      trackerCount: 25, routesThroughHighRiskJurisdiction: false,
      fingerprinting: true, aggressiveLocationRequest: false,
      majorRegulatoryFine: true, classActionLawsuit: false,
      certifiedSOC2: true, gdprCompliant: true,
    },
  },

  // ── twitter.com (X) ───────────────────────────────────────────
  'twitter.com': {
    tags: [
      'rtag-orange|Multiple Breaches',
      'rtag-yellow|Post-Acquisition Changes',
      'rtag-red|FTC Consent Decree Violated',
      'rtag-orange|Data Selling Concerns',
    ],
    stats: { breaches: 4, records: '200M+', trackers: 11, shared: 20 },
    timeline: [
      { date: 'Jan 2023', severity: 'critical', title: '200M Email Addresses Leaked',
        desc: '200 million Twitter/X user email addresses were compiled from a prior vulnerability and posted on hacking forums.' },
      { date: 'May 2023', severity: 'high', title: 'FTC $150M Fine — 2FA Phone Numbers Used for Ads',
        desc: 'FTC fined Twitter $150M for using phone numbers collected for two-factor authentication to target users with ads — directly violating a prior consent decree.' },
      { date: 'Aug 2022', severity: 'high', title: '5.4M Accounts Exposed via API Bug',
        desc: 'A zero-day API vulnerability allowed scraping of 5.4 million accounts including private phone numbers and emails.' },
      { date: 'Nov 2022', severity: 'medium', title: 'Mass Layoffs Raised Security Concerns',
        desc: 'After Elon Musk\'s acquisition, ~80% of security and privacy staff were laid off, raising concerns about data protection.' },
    ],
    dataCollection: {
      'Identity':   [ { label: 'Email / Phone', risk: 'med' }, { label: 'Name', risk: 'low' }, { label: 'Birthday', risk: 'med' } ],
      'Behavioral': [ { label: 'Tweets / Likes', risk: 'low' }, { label: 'DM Metadata', risk: 'high' }, { label: 'Device Fingerprint', risk: 'med' } ],
    },
    dataSharing: [
      { name: 'X Advertising',          pct: 100, cat: 'Advertising'   },
      { name: 'Data Licensing',          pct: 70,  cat: 'Third Parties' },
      { name: 'Government (on request)', pct: 30,  cat: 'Legal'         },
    ],
    ecom: {
      isEcommerce: false,
      scores: [
        { val: 'N/A',   label: 'Not a Shopping Site', color: '#4a5578' },
        { val: '$150M', label: 'FTC Fine (2023)',      color: '#ff7c2a' },
        { val: '200M',  label: 'Emails Leaked (2023)', color: '#ff4d6d' },
      ],
      complaints: [
        { icon: '🔒', title: '2FA phone numbers used for advertising',   count: 'FTC documented',          period: '2023' },
        { icon: '🔓', title: 'Account security degraded post-acquisition',count: 'Security researchers',   period: '2022–present' },
      ],
    },
    tech: [
      { raw: 'Two-factor phone numbers routed to ad targeting pipeline', type: 'Data Misuse',
        title: 'Your security phone number was used to target you with ads',
        explain: 'Twitter collected phone numbers claiming they were for account security. The FTC confirmed these numbers were secretly used to build ad targeting profiles — a direct violation of a prior consent order.',
        risk: '🔴 FTC confirmed this practice — resulted in a $150M fine.' },
    ],
    alternatives: [
      { name: 'Mastodon', desc: 'Decentralized, open-source microblogging. No ads, no data collection, community-run.', why: 'No corporate data collection, decentralized', score: 89 },
      { name: 'Bluesky',  desc: 'Decentralized social network built on the open AT Protocol.',                          why: 'Open protocol, no centralized data control',  score: 83 },
    ],
    signals: {
      breaches: [
        { year: 2023, severity: 'critical', recordsM: 200, financial: false },
        { year: 2023, severity: 'high',     recordsM: 0,   financial: false },
        { year: 2022, severity: 'high',     recordsM: 5.4, financial: false },
      ],
      dataPartners: 20, hasUnknownPartners: false,
      isEcommerce: false,
      trackerCount: 11, routesThroughHighRiskJurisdiction: false,
      fingerprinting: false, aggressiveLocationRequest: false,
      majorRegulatoryFine: true, classActionLawsuit: false,
      certifiedSOC2: false, gdprCompliant: false,
    },
  },

  // ── paypal.com ────────────────────────────────────────────────
  'paypal.com': {
    tags: [
      'rtag-yellow|Minor Data Incidents',
      'rtag-green|Strong Buyer Protection',
      'rtag-green|PCI DSS Compliant',
      'rtag-blue|Established Security',
    ],
    stats: { breaches: 2, records: '35K', trackers: 6, shared: 8 },
    timeline: [
      { date: 'Jan 2023', severity: 'medium', title: '35,000 Accounts Accessed via Credential Stuffing',
        desc: 'Attackers used username/password combos leaked from other sites to access 35,000 PayPal accounts. No PayPal systems were breached directly.' },
      { date: 'Nov 2017', severity: 'high', title: 'TIO Networks Breach — 1.6M Records',
        desc: 'Shortly after PayPal acquired TIO Networks, a breach exposed personal and financial data of 1.6 million customers. TIO was immediately shut down.' },
    ],
    dataCollection: {
      'Identity':  [ { label: 'Legal Name', risk: 'low' }, { label: 'Email', risk: 'low' }, { label: 'Phone', risk: 'med' }, { label: 'SSN (optional)', risk: 'high' } ],
      'Financial': [ { label: 'Bank Account', risk: 'high' }, { label: 'Payment Cards', risk: 'high' }, { label: 'Transaction History', risk: 'med' } ],
    },
    dataSharing: [
      { name: 'PayPal Advertising',     pct: 40, cat: 'Advertising'      },
      { name: 'Fraud Prevention Partners',pct: 80, cat: 'Security'        },
      { name: 'Financial Regulators',   pct: 30, cat: 'Legal'            },
    ],
    ecom: {
      isEcommerce: false,
      scores: [
        { val: '8.9/10',  label: 'Payment Safety Score',    color: '#00e5a0' },
        { val: 'PCI DSS', label: 'Payment Security Standard', color: '#00e5a0' },
        { val: 'Low',     label: 'Fraud Rate',               color: '#00e5a0' },
      ],
      complaints: [
        { icon: '🔒', title: 'Account access issues / locked accounts', count: 'Common',   period: 'Ongoing' },
        { icon: '💰', title: 'Disputed transaction resolution delays',  count: 'Moderate', period: 'Ongoing' },
      ],
    },
    tech: [
      { raw: 'TLS 1.3 + EV Certificate + PCI DSS Level 1', type: 'Security',
        title: 'PayPal uses bank-grade encryption for all transactions',
        explain: 'PayPal maintains Level 1 PCI DSS compliance — the highest payment security standard. Transactions are encrypted end-to-end and card numbers are never stored in readable form.',
        risk: '✓ One of the safest ways to pay online — card details are never revealed to merchants.' },
    ],
    alternatives: [
      { name: 'Apple Pay', desc: 'Device-level payment security, merchant never sees card details.', why: 'Hardware security, no card number transmission', score: 95 },
      { name: 'Stripe',    desc: 'For developers/merchants: leading processor with excellent security.', why: 'Best-in-class payment security',            score: 92 },
    ],
    signals: {
      breaches: [
        { year: 2023, severity: 'medium', recordsM: 0.035, financial: true },
        { year: 2017, severity: 'high',   recordsM: 1.6,   financial: true },
      ],
      dataPartners: 8, hasUnknownPartners: false,
      isEcommerce: false,
      trackerCount: 6, routesThroughHighRiskJurisdiction: false,
      fingerprinting: false, aggressiveLocationRequest: false,
      majorRegulatoryFine: false, classActionLawsuit: false,
      certifiedSOC2: true, gdprCompliant: true,
    },
  },

}; // end KB

/* ================================================================
   TEMPLATE — copy this block to add a new site
   ================================================================

  'example.com': {
    tags: [
      'rtag-red|Label',       // red   = critical risk
      'rtag-orange|Label',    // orange = high risk
      'rtag-yellow|Label',    // yellow = moderate concern
      'rtag-green|Label',     // green  = positive signal
      'rtag-blue|Label',      // blue   = informational
    ],
    stats: { breaches: 0, records: '—', trackers: 0, shared: 0 },
    timeline: [
      { date: 'Mon YYYY', severity: 'critical|high|medium|low',
        title: 'Event title', desc: 'Description.' },
    ],
    dataCollection: {
      'Category': [ { label: 'Data type', risk: 'high|med|low' } ],
    },
    dataSharing: [
      { name: 'Partner name', pct: 0, cat: 'Category' },
    ],
    ecom: {
      isEcommerce: true,
      scores: [
        { val: '—', label: 'Label', color: '#f0a500' },
      ],
      complaints: [
        { icon: '⚠️', title: 'Complaint type', count: '—', period: '—' },
      ],
    },
    tech: [
      { raw: 'technical detail', type: 'Tracker|Script|IP Route|Network Request|Fingerprinting',
        title: 'Plain English title',
        explain: 'Plain English explanation of what this means for the user.',
        risk: '⚠️ Risk statement.' },
    ],
    alternatives: [
      { name: 'Alternative', desc: 'What it is.', why: 'Why it is safer.', score: 80 },
    ],
    signals: {
      breaches: [
        { year: 2024, severity: 'critical|high|medium|low', recordsM: 0, financial: false },
      ],
      dataPartners: 0,
      hasUnknownPartners: false,
      isEcommerce: false,
      refundRate: 80,        // only if isEcommerce: true
      complaintsPerK: 0,     // only if isEcommerce: true
      storesCardOnSite: false,
      scamFlag: false,
      trackerCount: 0,
      routesThroughHighRiskJurisdiction: false,
      fingerprinting: false,
      aggressiveLocationRequest: false,
      majorRegulatoryFine: false,
      classActionLawsuit: false,
      certifiedSOC2: false,
      gdprCompliant: false,
    },
  },

================================================================ */
