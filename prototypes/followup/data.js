/* FollowUp prototype: fictional sample data. Names, businesses and figures are made up.
   The board is set on Wednesday 30 September 2026. Days are stored as offsets from that
   Wednesday (0 = today, -1 = Tuesday, 2 = Friday) and times as minutes after midnight. */
window.FOLLOWUP_DATA = (function () {
  'use strict';

  /* The team. "you" is Kristena. */
  var TEAM = {
    you: { name: 'Kristena Bingham', short: 'You', first: 'Kristena', ini: 'KB', tone: 'green' },
    daniel: { name: 'Daniel Brooks', short: 'Daniel', first: 'Daniel', ini: 'DB', tone: 'violet' },
    maya: { name: 'Maya Chen', short: 'Maya', first: 'Maya', ini: 'MC', tone: 'amber' },
    andre: { name: 'Andre Grant', short: 'Andre', first: 'Andre', ini: 'AG', tone: 'blue' }
  };
  var TEAM_KEYS = ['you', 'daniel', 'maya', 'andre'];
  var STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won'];

  /* [organisation, first, last, title, industry, area, owner, priority, deal, amount (J$), stage, added day, website] */
  var CONTACTS = [
    ['Caribbean Tech Ltd', 'Dane', 'Mitchell', 'CEO', 'Technology', 'Kingston', 'you', 'High', '3-month plan', 450000, 'Proposal', -21, 'caribbeantech.com'],
    ['Island Supplies', 'Alesha', 'Grant', 'Purchasing Manager', 'Wholesale', 'Newport West', 'daniel', 'High', '40-seat plan', 520000, 'Qualified', -30, 'islandsupplies.com.jm'],
    ['J. Williams', 'Jason', 'Williams', 'Architect', 'Architecture', 'Liguanea', 'daniel', 'High', 'Studio plan', 120000, 'Qualified', -16, 'jwilliams.design'],
    ['Bluewave Media', 'Keisha', 'Lindsay', 'Operations Lead', 'Media', 'New Kingston', 'maya', 'Medium', 'Annual renewal', 640000, 'Negotiation', -180, 'bluewavemedia.com'],
    ['K. Morgan', 'Kieran', 'Morgan', 'Consultant', 'Consulting', 'Barbican', 'you', 'Low', 'Starter plan', 60000, 'Lead', -3, 'kmorgan.consulting'],
    ['Palm Retail', 'Nicole', 'Harriott', 'Store Manager', 'Retail', 'Half Way Tree', 'andre', 'Low', '6-month plan', 240000, 'Proposal', -40, 'palmretail.com.jm'],
    ['R. Clarke', 'Ryan', 'Clarke', 'Event Planner', 'Events', 'Constant Spring', 'maya', 'Medium', 'Starter plan', 60000, 'Qualified', -6, 'rclarke.events'],
    ['Blue Mountain Roasters', 'Tameka', 'Bowen', 'Owner', 'Food & beverage', 'Papine', 'daniel', 'Medium', '3-month plan', 180000, 'Proposal', -52],
    ['Harbour Fitness', 'Omari', 'Pottinger', 'Gym Manager', 'Fitness', 'Harbour View', 'andre', 'Low', 'Starter plan', 90000, 'Lead', -12],
    ['Liguanea Dental', 'Carla', 'Whitely', 'Practice Manager', 'Healthcare', 'Liguanea', 'maya', 'Medium', 'Annual plan', 360000, 'Won', -95],
    ['Red Hills Hardware', 'Neil', 'Samuda', 'Owner', 'Hardware', 'Red Hills', 'andre', 'Low', '6-month plan', 150000, 'Won', -210],
    ['Kingston Print Co.', 'Shauntae', 'Miller', 'Director', 'Printing', 'Downtown', 'maya', 'Low', 'Annual renewal', 280000, 'Negotiation', -300],
    ['Hope Road Florist', 'Anika', 'Plummer', 'Owner', 'Retail', 'Liguanea', 'daniel', 'Low', 'Starter plan', 48000, 'Won', -140],
    ['Mona Tutoring Centre', 'Rochelle', 'Gayle', 'Director', 'Education', 'Mona', 'you', 'Low', '3-month plan', 105000, 'Won', -75],
    ['Norbrook Villas', 'Gregory', 'Hall', 'Property Manager', 'Real estate', 'Norbrook', 'maya', 'Low', 'Annual plan', 300000, 'Won', -260],
    ['Uptown Optical', 'Sheree', 'Lue', 'Optometrist', 'Healthcare', 'Half Way Tree', 'you', 'High', 'Annual plan', 330000, 'Negotiation', -45],
    ['Seaview Logistics', 'Marcus', 'Dawes', 'Operations Manager', 'Logistics', 'Newport West', 'andre', 'Medium', 'Annual renewal', 720000, 'Negotiation', -400],
    ['Crossroads Pharmacy', 'Janice', 'Tomlinson', 'Pharmacist', 'Healthcare', 'Cross Roads', 'you', 'High', '6-month plan', 210000, 'Proposal', -25],
    ['Minott & Hall Attorneys', 'Sandra', 'Minott', 'Partner', 'Legal', 'New Kingston', 'daniel', 'Medium', 'Annual plan', 480000, 'Proposal', -33],
    ['Vineyard Bakery', 'Leroy', 'Dennis', 'Owner', 'Food & beverage', 'Vineyard Town', 'andre', 'Low', 'Starter plan', 45000, 'Won', -120],
    ['Ocean Blue Studios', 'Jamal', 'Wint', 'Creative Director', 'Media', 'New Kingston', 'maya', 'Medium', '3-month plan', 165000, 'Qualified', -9],
    ['Coral Catering Co.', 'Petal', 'Hewitt', 'Owner', 'Food & beverage', 'Havendale', 'daniel', 'Low', 'Starter plan', 54000, 'Lead', -2],
    ['Stony Hill Auto', 'Delano', 'Facey', 'Owner', 'Automotive', 'Stony Hill', 'andre', 'Medium', '6-month plan', 195000, 'Qualified', -20],
    ['Harbour Street Traders', 'Ainsley', 'Watson', 'Owner', 'Wholesale', 'Downtown', 'andre', 'Low', 'Annual plan', 260000, 'Won', -330],
    ['Meadowbrook Motors', 'Kayon', 'Mattis', 'Sales Manager', 'Automotive', 'Meadowbrook', 'daniel', 'Medium', 'Annual plan', 420000, 'Proposal', -60],
    ['Barbican Books & Café', 'Imani', 'Cole', 'Owner', 'Retail', 'Barbican', 'you', 'Low', 'Starter plan', 48000, 'Lead', -4],
    ['Liguanea Pet Clinic', 'Andrea', 'Chung', 'Veterinarian', 'Healthcare', 'Liguanea', 'maya', 'Medium', '6-month plan', 180000, 'Won', -150],
    ['Skyline Solar', 'Troy', 'Sutherland', 'Sales Lead', 'Energy', 'Red Hills', 'andre', 'High', 'Annual plan', 560000, 'Negotiation', -70],
    ['Papine Farm Supplies', 'Lorna', 'Kerr', 'Owner', 'Agriculture', 'Papine', 'daniel', 'Low', 'Starter plan', 60000, 'Lead', -18],
    ['Kingston Cool Air', 'Dwayne', 'Lawrence', 'Owner', 'Services', 'Cross Roads', 'andre', 'Low', '3-month plan', 90000, 'Won', -200],
    ['Mango Walk Café', 'Tanesha', 'Reckord', 'Owner', 'Food & beverage', 'New Kingston', 'maya', 'Low', 'Starter plan', 45000, 'Qualified', -27],
    ['Hughenden Early Learning', 'Paulette', 'Nembhard', 'Principal', 'Education', 'Hughenden', 'you', 'Medium', 'Annual plan', 240000, 'Won', -365],
    ['Constant Spring Tiles', 'Fitzroy', 'McFarlane', 'Owner', 'Construction', 'Constant Spring', 'andre', 'Low', '6-month plan', 150000, 'Proposal', -48],
    ['Sentinel Security', 'Andrew', 'Jarrett', 'Director', 'Security', 'New Kingston', 'daniel', 'Medium', 'Annual plan', 600000, 'Qualified', -22],
    ['Cherry Gardens Interiors', 'Natasha', 'Ffrench', 'Lead Designer', 'Interiors', 'Cherry Gardens', 'maya', 'Low', '3-month plan', 120000, 'Lead', -1],
    ['Rollington Movers', 'Shane', 'Dacres', 'Owner', 'Logistics', 'Rollington Town', 'andre', 'Low', 'Starter plan', 60000, 'Won', -110],
    ['Manor Park Physio', 'Kerri', 'Myrie', 'Physiotherapist', 'Healthcare', 'Manor Park', 'you', 'Medium', '6-month plan', 195000, 'Proposal', -38],
    ['Waterloo Car Care', 'Romaine', 'Scott', 'Owner', 'Automotive', 'Waterloo Road', 'daniel', 'Low', 'Starter plan', 45000, 'Won', -90],
    ['Duhaney Distributors', 'Clifton', 'Rose', 'Manager', 'Wholesale', 'Duhaney Park', 'andre', 'Medium', 'Annual plan', 380000, 'Qualified', -14],
    ['Studio Nine Salon', 'Tamara', 'Kelly', 'Owner', 'Beauty', 'Hope Pastures', 'maya', 'Low', 'Starter plan', 48000, 'Won', -160],
    ['Yard Brew Co.', 'Everald', 'Chin', 'Owner', 'Food & beverage', 'Downtown', 'daniel', 'Medium', '6-month plan', 210000, 'Negotiation', -85],
    ['Heights Medical Lab', 'Joy', 'Stennett', 'Lab Manager', 'Healthcare', 'Mona', 'you', 'Medium', 'Annual plan', 420000, 'Qualified', -11],
    ['Harbour Catch Seafood', 'Oral', 'Grandison', 'Owner', 'Food & beverage', 'Harbour View', 'andre', 'Low', 'Starter plan', 52000, 'Lead', -9],
    ['Bright Path Tutors', 'Kimberly', 'Nugent', 'Director', 'Education', 'Havendale', 'maya', 'Low', '3-month plan', 90000, 'Proposal', -29],
    ['Keystone Accounting', 'Owen', 'Samms', 'Partner', 'Finance', 'New Kingston', 'daniel', 'Medium', 'Annual plan', 450000, 'Won', -240],
    ['Mountain View Clinic', 'Pauline', 'Dunkley', 'Administrator', 'Healthcare', 'Mountain View', 'you', 'High', 'Annual plan', 510000, 'Proposal', -19],
    ['Southside Timber', 'Errol', 'Wynter', 'Owner', 'Construction', 'Spanish Town Road', 'andre', 'Low', '6-month plan', 135000, 'Won', -130],
    ['Hillside Growers', 'Yvette', 'Lyn', 'Owner', 'Agriculture', 'Stony Hill', 'daniel', 'Low', 'Starter plan', 45000, 'Qualified', -44],
    ['Little Stars Daycare', 'Sherika', 'Dawkins', 'Owner', 'Education', 'Barbican', 'maya', 'Low', 'Starter plan', 54000, 'Lead', -13],
    ['Sharp Stitch Tailoring', 'Winston', 'Ennis', 'Owner', 'Retail', 'Downtown', 'andre', 'Low', 'Starter plan', 42000, 'Won', -170],
    ['Kingston Heritage Tours', 'Kadeem', 'Baker', 'Manager', 'Tourism', 'New Kingston', 'maya', 'Medium', '3-month plan', 150000, 'Proposal', -36],
    ['Liguanea Fresh Market', 'Beverley', 'Hanson', 'Manager', 'Retail', 'Liguanea', 'daniel', 'Medium', 'Annual plan', 330000, 'Negotiation', -58]
  ];

  /* Open tasks: [organisation, title, type, priority, owner, day, time] */
  var OPEN = [
    /* Overdue */
    ['Caribbean Tech Ltd', 'Call back', 'call', 'High', 'you', 0, '08:40'],
    ['Island Supplies', 'Send proposal', 'email', 'High', 'daniel', 0, '07:45'],
    ['J. Williams', 'Follow up', 'call', 'High', 'daniel', -1, '15:00'],
    ['Bluewave Media', 'Check contract', 'email', 'Medium', 'maya', -2, '11:00'],
    ['K. Morgan', 'Intro call', 'call', 'Low', 'you', -2, '14:00'],
    ['Palm Retail', 'Review quote', 'email', 'Low', 'andre', -3, '10:00'],
    ['Harbour Fitness', 'Send brochure', 'email', 'Low', 'andre', -4, '10:00'],
    ['Kingston Print Co.', 'Renewal reminder', 'email', 'Low', 'maya', -5, '09:30'],
    ['Hope Road Florist', 'Check in', 'call', 'Low', 'daniel', -6, '11:00'],
    ['Red Hills Hardware', 'Confirm delivery date', 'call', 'Low', 'andre', -7, '14:00'],
    ['Mona Tutoring Centre', 'Send thank-you note', 'email', 'Low', 'you', -8, '10:00'],
    ['Norbrook Villas', 'Update contact details', 'note', 'Low', 'maya', -9, '16:00'],
    /* Later today */
    ['Blue Mountain Roasters', 'Send price list', 'email', 'Medium', 'daniel', 0, '12:30'],
    ['Uptown Optical', 'Demo walkthrough', 'meeting', 'High', 'you', 0, '13:00'],
    ['Seaview Logistics', 'Call about renewal', 'call', 'Medium', 'andre', 0, '13:30'],
    ['Liguanea Dental', 'Confirm onboarding', 'call', 'Medium', 'maya', 0, '14:00'],
    ['Crossroads Pharmacy', 'Send contract', 'email', 'High', 'you', 0, '14:30'],
    ['Minott & Hall Attorneys', 'Follow up on proposal', 'call', 'Medium', 'daniel', 0, '15:00'],
    ['Vineyard Bakery', 'Check in', 'call', 'Low', 'andre', 0, '15:30'],
    ['Ocean Blue Studios', 'Book kickoff meeting', 'meeting', 'Medium', 'maya', 0, '16:30'],
    /* Thursday */
    ['Skyline Solar', 'Send revised quote', 'email', 'High', 'andre', 1, '09:30'],
    ['Meadowbrook Motors', 'Follow up on proposal', 'call', 'Medium', 'daniel', 1, '10:00'],
    ['Heights Medical Lab', 'Intro call', 'call', 'Medium', 'you', 1, '11:00'],
    ['Duhaney Distributors', 'Send price list', 'email', 'Medium', 'andre', 1, '13:30'],
    ['Kingston Heritage Tours', 'Check in', 'call', 'Low', 'maya', 1, '14:30'],
    ['Coral Catering Co.', 'Intro call', 'call', 'Medium', 'daniel', 1, '15:00'],
    ['Mountain View Clinic', 'Demo walkthrough', 'meeting', 'High', 'you', 1, '16:00'],
    /* Friday */
    ['Manor Park Physio', 'Review proposal', 'call', 'Medium', 'you', 2, '10:00'],
    ['Sentinel Security', 'Book site visit', 'meeting', 'Medium', 'daniel', 2, '10:30'],
    ['Stony Hill Auto', 'Send proposal', 'email', 'Medium', 'andre', 2, '11:00'],
    ['Yard Brew Co.', 'Check contract', 'email', 'Medium', 'daniel', 2, '13:00'],
    ['Cherry Gardens Interiors', 'Intro call', 'call', 'Low', 'maya', 2, '14:00'],
    ['Liguanea Fresh Market', 'Agree final terms', 'meeting', 'High', 'daniel', 2, '15:00'],
    ['Barbican Books & Café', 'Intro call', 'call', 'Low', 'you', 2, '15:30'],
    /* Saturday */
    ['Mango Walk Café', 'Drop off samples', 'meeting', 'Low', 'maya', 3, '10:00'],
    ['Studio Nine Salon', 'Check in', 'call', 'Low', 'maya', 3, '11:00'],
    /* Next week and later */
    ['Caribbean Tech Ltd', 'Follow up on proposal', 'call', 'High', 'you', 5, '10:00'],
    ['Bluewave Media', 'Renewal meeting', 'meeting', 'Medium', 'maya', 5, '11:00'],
    ['Constant Spring Tiles', 'Follow up on proposal', 'call', 'Low', 'andre', 6, '10:00'],
    ['R. Clarke', 'Send proposal', 'email', 'Medium', 'maya', 6, '11:00'],
    ['Bright Path Tutors', 'Review proposal', 'call', 'Low', 'maya', 6, '14:00'],
    ['Papine Farm Supplies', 'Intro call', 'call', 'Low', 'daniel', 7, '10:00'],
    ['Hillside Growers', 'Send information', 'email', 'Low', 'daniel', 7, '11:30'],
    ['Little Stars Daycare', 'Intro call', 'call', 'Low', 'maya', 8, '09:30'],
    ['Uptown Optical', 'Contract signing', 'meeting', 'High', 'you', 9, '10:00'],
    ['Harbour Catch Seafood', 'Intro call', 'call', 'Low', 'andre', 12, '10:00'],
    ['Keystone Accounting', 'Renewal check-in', 'call', 'Medium', 'daniel', 19, '10:00'],
    ['Liguanea Dental', 'Quarterly review', 'meeting', 'Low', 'maya', 21, '11:00']
  ];

  /* Tasks already done: [organisation, title, type, priority, owner, done day, done at, result] */
  var DONE = [
    ['R. Clarke', 'Intro call', 'call', 'Medium', 'maya', 0, '08:40', 'Wants a quote for the starter plan'],
    ['Caribbean Tech Ltd', 'Pricing call', 'call', 'High', 'you', -1, '16:05', 'Went through the new pricing'],
    ['Palm Retail', 'Send quote', 'email', 'Low', 'andre', -1, '11:20', 'Quote sent for the 6-month plan'],
    ['Seaview Logistics', 'Send renewal terms', 'email', 'Medium', 'andre', -1, '09:50', 'Renewal terms sent'],
    ['Liguanea Dental', 'Onboarding call', 'call', 'Medium', 'maya', -1, '14:10', 'Walked the front desk through setup'],
    ['Minott & Hall Attorneys', 'Send proposal', 'email', 'Medium', 'daniel', -1, '10:40', 'Proposal sent'],
    ['Skyline Solar', 'Site visit', 'meeting', 'High', 'andre', -1, '13:00', 'Visited the warehouse, wants a revised quote'],
    ['Bluewave Media', 'Renewal call', 'call', 'Medium', 'maya', -2, '10:15', 'Happy to renew, checking the contract'],
    ['Uptown Optical', 'Intro call', 'call', 'High', 'you', -2, '11:30', 'Booked a demo for Wednesday'],
    ['Meadowbrook Motors', 'Send proposal', 'email', 'Medium', 'daniel', -2, '15:20', 'Proposal sent'],
    ['Crossroads Pharmacy', 'Needs review', 'meeting', 'High', 'you', -2, '13:45', 'Agreed the 6-month plan in principle'],
    ['Ocean Blue Studios', 'Intro call', 'call', 'Medium', 'maya', -2, '16:30', 'Wants to start after the kickoff']
  ];

  /* Notes and other activity: [organisation, kind, text, who, day, time] */
  var EVENTS = [
    ['Island Supplies', 'note', 'Wants a quote for 40 seats', 'daniel', 0, '10:28'],
    ['Caribbean Tech Ltd', 'stage', 'Deal moved to Proposal', 'you', 0, '09:40'],
    ['K. Morgan', 'assign', 'New lead', 'andre', 0, '07:40'],
    ['Caribbean Tech Ltd', 'note', 'Interested in 3-month plan. Send proposal and follow up next week.', 'you', -1, '16:12'],
    ['Skyline Solar', 'stage', 'Deal moved to Negotiation', 'andre', -1, '13:20'],
    ['Bluewave Media', 'note', 'Would like the renewal split into two payments.', 'maya', -2, '10:22'],
    ['Crossroads Pharmacy', 'stage', 'Deal moved to Proposal', 'you', -2, '14:00'],
    ['J. Williams', 'note', 'Working from home on Tuesdays. Calls after 3 PM work best.', 'daniel', -5, '12:10']
  ];

  var NOTE_TEMPLATES = [
    'Prefers WhatsApp for quick questions.',
    'Best reached after 2 PM. Mornings are busy.',
    'Wants numbers in writing before any call.',
    'Decides with a business partner. Allow a few days.',
    'Asked about paying quarterly.',
    'Happy with the service so far.',
    'Front desk takes messages. Ask for them by name.',
    'Compares prices. Send the full breakdown, not a total.'
  ];

  /* Reports: last 12 complete weeks, oldest first: [on time, late] */
  var WEEKS = [[21, 9], [24, 8], [23, 8], [27, 7], [28, 6], [30, 6], [29, 5], [33, 5], [34, 4], [32, 4], [36, 3], [35, 3]];
  var REPORT_PERIODS = {
    12: {
      team: [['you', 104, 92], ['daniel', 96, 88], ['maya', 88, 90], ['andre', 83, 81]],
      won: 2310000,
      reply: [['WhatsApp', 1.9], ['Phone', 3.8], ['Email', 17]]
    },
    4: {
      team: [['you', 36, 95], ['daniel', 34, 91], ['maya', 33, 93], ['andre', 31, 86]],
      won: 815000,
      reply: [['WhatsApp', 1.6], ['Phone', 3.4], ['Email', 15]]
    }
  };

  function mins(s) { var p = s.split(':'); return +p[0] * 60 + +p[1]; }
  function slug(s) { return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ''); }
  function phoneFor(i) {
    var a = 200 + (i * 47) % 700;
    var b = 1000 + (i * 7919) % 9000;
    return '876-' + a + '-' + b;
  }

  function build() {
    var contacts = [], byOrg = {};
    CONTACTS.forEach(function (r, i) {
      var site = r[12] || slug(r[0]) + '.com';
      var c = {
        id: 'c' + (i + 1), org: r[0], first: r[1], last: r[2], title: r[3], industry: r[4], area: r[5],
        owner: r[6], priority: r[7], website: site, phone: phoneFor(i + 1),
        email: r[1].toLowerCase() + '@' + site,
        deal: { name: r[8], amount: r[9], stage: r[10] },
        added: r[11], history: []
      };
      var addedBy = r[0] === 'K. Morgan' ? 'andre' : r[6];
      c.history.push({ kind: 'added', text: r[10] === 'Won' ? 'Added as a contact' : 'New lead', who: addedBy, day: r[11], time: 540 + (i * 37) % 420 });
      if (r[10] === 'Won') {
        c.history.push({ kind: 'stage', text: 'Deal moved to Won', who: r[6], day: Math.max(r[11], Math.min(-3, r[11] + 20 + (i * 7) % 30)), time: 600 + (i * 53) % 360 });
      }
      if (i >= 7) {
        c.history.push({ kind: 'note', text: NOTE_TEMPLATES[(i * 5) % NOTE_TEMPLATES.length], who: r[6], day: Math.max(r[11], Math.min(-3, r[11] + 2 + (i * 11) % 20)), time: 570 + (i * 29) % 400 });
      }
      contacts.push(c);
      byOrg[r[0]] = c;
    });
    var get = function (org) { var c = byOrg[org]; if (!c) throw new Error('No contact ' + org); return c; };

    EVENTS.forEach(function (e) {
      get(e[0]).history.push({ kind: e[1], text: e[2], who: e[3], day: e[4], time: mins(e[5]) });
    });

    var seq = 1, tasks = [];
    OPEN.forEach(function (r) {
      var c = get(r[0]);
      tasks.push({ id: 't' + seq++, contactId: c.id, title: r[1], type: r[2], priority: r[3], owner: r[4], day: r[5], time: mins(r[6]), status: 'open' });
    });
    DONE.forEach(function (r) {
      var c = get(r[0]);
      var at = mins(r[6]);
      tasks.push({ id: 't' + seq++, contactId: c.id, title: r[1], type: r[2], priority: r[3], owner: r[4], day: r[5], time: at, status: 'done', doneDay: r[5], doneAt: at, result: r[7] });
      c.history.push({ kind: 'done', text: r[1], note: r[7], who: r[4], day: r[5], time: at });
    });

    return {
      v: 5,
      seq: seq,
      contactSeq: contacts.length + 1,
      contacts: contacts,
      tasks: tasks,
      settings: { start: 8 * 60, end: 17 * 60, defaultTime: 9 * 60, remind: 0, weekends: false }
    };
  }

  return { build: build, version: 5, team: TEAM, teamKeys: TEAM_KEYS, stages: STAGES, weeks: WEEKS, periods: REPORT_PERIODS };
})();
