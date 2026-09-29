/* FollowUp prototype: fictional sample data. Names, businesses and figures are made up.
   The board is set on Wednesday 30 September 2026. Days are stored as offsets from that
   Wednesday (0 = today, -2 = Monday, 2 = Friday) and times as minutes after midnight. */
window.FOLLOWUP_DATA = (function () {
  'use strict';

  /* [first, last, company, area, owner] — 86 clients */
  var CLIENTS = [
    ['Marsha', 'Brown', "Brown's Hardware", 'Half Way Tree', 'you'],
    ['Devon', 'Clarke', 'Clarke Auto Glass', 'Cross Roads', 'shanice'],
    ['Kerry-Ann', 'Lewis', 'Lewis Family Pharmacy', 'Liguanea', 'you'],
    ['Omar', 'Grant', 'Grant Print & Signs', 'New Kingston', 'andre'],
    ['Tanya', 'Reid', "Reid's Bakery", 'Papine', 'you'],
    ['Nadine', 'Scott', "Scott's Beauty Supply", 'Constant Spring', 'you'],
    ['Paul', 'Wright', 'Wright Way Couriers', 'Downtown', 'andre'],
    ['Devon', 'Palmer', "Palmer's Tyre Shop", 'Waltham Park', 'andre'],
    ['Jermaine', 'Thompson', 'Thompson Electrical', 'Red Hills', 'andre'],
    ['Sasha-Gaye', 'Williams', 'Williams Florist', 'Barbican', 'shanice'],
    ['Leon', 'Francis', 'Francis & Son Plumbing', 'Hope Pastures', 'you'],
    ['Kadian', 'Henry', "Henry's Pharmacy", 'Manor Park', 'andre'],
    ['Rohan', 'Edwards', 'Edwards Tiles & Stone', 'Spanish Town Road', 'shanice'],
    ['Simone', 'Barrett', "Barrett's Salon", 'Cherry Gardens', 'you'],
    ['Christopher', 'Gordon', 'Gordon Glass & Aluminium', 'Harbour View', 'andre'],
    ['Shelly-Ann', 'Walker', "Walker's Pastry", 'Vineyard Town', 'shanice'],
    ['Marlon', 'Bailey', "Bailey's Gym", 'Meadowbrook', 'andre'],
    ['Dionne', 'Harris', 'Harris Medical Supplies', 'Mona', 'you'],
    ['Tamika', 'Allen', "Allen's Wholesale", 'Downtown', 'you'],
    ['Keisha', 'McKenzie', 'McKenzie Catering', 'Havendale', 'shanice'],
    ['Damion', 'Robinson', 'Robinson Hardware & Lumber', 'Duhaney Park', 'andre'],
    ['Latoya', 'Stewart', "Stewart's Day Care", 'Barbican', 'you'],
    ['Garfield', 'Chambers', 'Chambers Auto Repair', 'Maxfield Avenue', 'andre'],
    ['Natalie', 'Powell', "Powell's Pharmacy", 'Stony Hill', 'shanice'],
    ['Ricardo', 'Spence', 'Spence Security', 'New Kingston', 'andre'],
    ['Nicole', 'Richards', 'Richards & Co. Accountants', 'New Kingston', 'you'],
    ['Kemar', 'Johnson', 'KJ Barber Studio', 'Half Way Tree', 'andre'],
    ['Stacy-Ann', 'Bennett', "Bennett's Beauty Bar", 'Portmore', 'shanice'],
    ['Craig', 'Dixon', 'Dixon Motor Parts', 'Cross Roads', 'andre'],
    ['Monique', 'Ellis', 'Ellis Kitchen Supplies', 'Liguanea', 'you'],
    ['Oneil', 'Hamilton', 'Hamilton Water Solutions', 'Constant Spring', 'andre'],
    ['Tricia', 'Morrison', "Morrison's Books", 'Mona', 'shanice'],
    ['Wayne', 'Ferguson', 'Ferguson Cold Storage', 'Newport West', 'andre'],
    ['Camille', 'Forbes', 'Forbes Optical', 'Half Way Tree', 'you'],
    ['Everton', 'Samuels', 'Samuels Block Factory', 'Washington Boulevard', 'andre'],
    ['Kimberley', 'Anderson', "Anderson's Laundromat", 'Vineyard Town', 'shanice'],
    ['Donovan', 'Taylor', 'Taylor Made Furniture', 'Rollington Town', 'andre'],
    ['Sherene', 'Blake', "Blake's Bridal", 'New Kingston', 'you'],
    ['Horace', 'Clarke', "Clarke's Jerk Centre", 'Harbour View', 'andre'],
    ['Yanique', 'Brown', "Yanique's Nail Studio", 'Portmore', 'shanice'],
    ['Delroy', 'Nelson', "Nelson's Electrical Supplies", 'Downtown', 'andre'],
    ['Renee', 'Lindo', 'Lindo Travel', 'New Kingston', 'you'],
    ['Clive', 'Mitchell', 'Mitchell Engineering', 'Harbour View', 'andre'],
    ['Annmarie', 'Graham', "Graham's Pet Supplies", 'Liguanea', 'shanice'],
    ['Fabian', 'Whyte', "Whyte's Car Wash", 'Waterloo Road', 'andre'],
    ['Karen', 'Buchanan', 'Buchanan Dental', 'Barbican', 'you'],
    ['Orville', 'Hylton', 'Hylton Hardware', 'Papine', 'andre'],
    ['Petrina', 'Wallace', 'Wallace Print Shop', 'Cross Roads', 'shanice'],
    ['Adrian', 'Palmer', 'Palmer Cool Air', 'Havendale', 'andre'],
    ['Jodi-Ann', 'Reid', "Jodi's Juice Bar", 'Mona', 'shanice'],
    ['Kirk', 'Ricketts', 'Ricketts Auto Spares', 'Spanish Town Road', 'andre'],
    ['Tashana', 'Brooks', 'Brooks Boutique', 'Liguanea', 'you'],
    ['Carlton', 'Bryan', "Bryan's Wholesale", 'Downtown', 'andre'],
    ['Rushane', 'Beckford', 'Beckford Tech Repairs', 'Half Way Tree', 'andre'],
    ['Sophia', 'Chin', "Chin's Supermarket", 'Meadowbrook', 'you'],
    ['Lloyd', 'Tulloch', 'Tulloch Construction', 'Red Hills', 'andre'],
    ['Marcia', 'Dunn', "Dunn's Uniforms", 'Cross Roads', 'shanice'],
    ['Kevin', 'Lee', "Lee's Hardware", 'Constant Spring', 'andre'],
    ['Ava', 'Mullings', 'Mullings Physio', 'Hope Pastures', 'you'],
    ['Dwight', 'Salmon', 'Salmon Movers', 'Newport West', 'andre'],
    ['Georgia', 'Frater', 'Frater Events', 'New Kingston', 'shanice'],
    ['Rayon', 'Hinds', 'Hinds Mechanical', 'Spanish Town Road', 'andre'],
    ['Kimone', 'Pryce', 'Pryce Hair Studio', 'Half Way Tree', 'shanice'],
    ['Jason', 'Wong', "Wong's Restaurant", 'New Kingston', 'you'],
    ['Sheldon', 'Ebanks', 'Ebanks Glass', 'Maxfield Avenue', 'andre'],
    ['Nordia', 'Stephenson', 'Stephenson Early Learning', 'Hughenden', 'you'],
    ['Patrick', 'Walters', 'Walters Office Supplies', 'Downtown', 'andre'],
    ['Tanisha', 'Smith', "Smith's Salon & Spa", 'Portmore', 'shanice'],
    ['Ian', 'Davis', 'Davis Insurance Brokers', 'New Kingston', 'you'],
    ['Nadia', 'McLean', 'McLean Dental Lab', 'Liguanea', 'you'],
    ['Kenroy', 'Blair', "Blair's Bar & Grill", 'Harbour View', 'andre'],
    ['Toni-Ann', 'Mais', 'Mais Accounting', 'New Kingston', 'shanice'],
    ['Duane', 'Gooden', 'Gooden Electrical', 'Meadowbrook', 'andre'],
    ['Melissa', 'Rowe', "Rowe's Party Rentals", 'Havendale', 'you'],
    ['Brian', 'Dyer', "Dyer's Tyres", 'Waltham Park', 'andre'],
    ['Shauna', 'Knight', 'Knight Pharmacy', 'Norbrook', 'you'],
    ['Garth', 'Sinclair', 'Sinclair Farm Market', 'Papine', 'andre'],
    ['Deborah', 'Reynolds', 'Reynolds Real Estate', 'New Kingston', 'you'],
    ['Oshane', 'Pinnock', 'Pinnock Cell Repairs', 'Half Way Tree', 'andre'],
    ['Sharon', 'Brissett', 'Brissett Tax Services', 'Cross Roads', 'shanice'],
    ['Neville', 'Bent', 'Bent Auto Body', 'Maxfield Avenue', 'andre'],
    ['Chantal', 'Hibbert', 'Hibbert Home Decor', 'Constant Spring', 'shanice'],
    ['Rohan', 'Levy', "Levy's Supermarket", 'Stony Hill', 'andre'],
    ['Alicia', 'Cunningham', 'Cunningham Design Studio', 'Barbican', 'you'],
    ['Trevor', 'Anglin', 'Anglin Solar', 'Red Hills', 'andre'],
    ['Janelle', 'Dacosta', 'Dacosta Imports', 'Downtown', 'shanice']
  ];

  /* Tips for the clients that appear on the board; everyone else gets one from the templates below. */
  var TIPS = {
    'Marsha Brown': 'Marsha picked up 4 of her last 5 calls before 11 AM.',
    'Devon Clarke': 'Devon reads email on the phone. Keep the quote to one page.',
    'Kerry-Ann Lewis': 'Kerry-Ann answers WhatsApp within the hour, calls less often.',
    'Omar Grant': 'Omar liked the reporting part of the demo most. Lead with that.',
    'Tanya Reid': 'Tanya renewed early last year after one reminder.',
    'Nadine Scott': 'Nadine pays by bank transfer and sends the receipt the same day.',
    'Paul Wright': 'Paul wants everything in writing. Follow each call with an email.',
    'Devon Palmer': 'Devon is at the shop from 7 AM. Mornings work best.',
    'Jermaine Thompson': 'Jermaine is on site most days. WhatsApp photos land faster than email.',
    'Sasha-Gaye Williams': 'Sasha-Gaye paid the last two invoices within a week of a call.',
    'Leon Francis': 'Leon picked up 3 of the last 4 calls after 2 PM.',
    'Kadian Henry': 'Kadian prefers a quick call to a long email.',
    'Rohan Edwards': 'Rohan compares prices. Send the full breakdown, not a total.',
    'Simone Barrett': 'Simone books clients all day Saturday. Avoid weekends.',
    'Christopher Gordon': 'Christopher likes to see things in person before deciding.',
    'Shelly-Ann Walker': 'Shelly-Ann approves proofs fastest on WhatsApp.',
    'Marlon Bailey': 'Marlon is at the front desk from 6 AM, quiet after 10.',
    'Dionne Harris': 'Dionne signs off renewals herself. Call her directly.',
    'Tamika Allen': 'Tamika usually pays within 3 days of a reminder.'
  };

  var TIP_TEMPLATES = [
    '{F} picked up {a} of the last {b} calls before 11 AM.',
    '{F} usually answers WhatsApp within the hour.',
    '{F} prefers email for anything with numbers in it.',
    'Best reached after 2 PM. Mornings are busy at the shop.',
    '{F} usually pays within 3 days of a reminder.',
    'Ask for {F} by name. The front desk takes messages.',
    '{F} picked up {a} of the last {b} calls after lunch.',
    '{F} reads WhatsApp faster than email.'
  ];

  /* Older history, most recent first: [text, day, who]. Done follow-ups add their own lines. */
  var HISTORY = {
    'Marsha Brown': [['Call: will pay by month end', -6, 'you'], ['Emailed invoice 1042', -32, 'you']],
    'Devon Clarke': [['Sent the first quote', -9, 'shanice']],
    'Kerry-Ann Lewis': [['Signed up for an install', -14, 'you']],
    'Omar Grant': [['Call: interested in a demo', -20, 'andre']],
    'Tanya Reid': [['Emailed last year’s receipt', -40, 'you']],
    'Nadine Scott': [['Emailed invoice 1038', -21, 'you']],
    'Paul Wright': [['Call: wants to start this month', -10, 'andre']],
    'Sasha-Gaye Williams': [['Emailed invoice 1047', -18, 'shanice']],
    'Tamika Allen': [['Emailed invoice 1051', -9, 'you']],
    'Dionne Harris': [['Emailed renewal terms', -12, 'you']]
  };

  /* When each named client was added: [day, who] */
  var ADDED = {
    'Marsha Brown': [-92, 'andre'],
    'Devon Clarke': [-150, 'shanice'],
    'Kerry-Ann Lewis': [-60, 'you'],
    'Omar Grant': [-40, 'andre'],
    'Tanya Reid': [-350, 'you'],
    'Nadine Scott': [-200, 'you'],
    'Paul Wright': [-12, 'andre']
  };

  var HISTORY_TEMPLATES = [
    'Call: happy with the service',
    'Emailed the monthly statement',
    'WhatsApp: asked about pricing',
    'Visited the shop',
    'Call: no changes needed',
    'Sent a thank-you note',
    'WhatsApp: confirmed opening hours',
    'Call: asked about the new plan'
  ];

  /* Unpaid invoices: [number, client, amount, issued day] */
  var INVOICES = [
    [1042, 'Marsha Brown', 84500, -32],
    [1038, 'Nadine Scott', 46200, -21],
    [1047, 'Sasha-Gaye Williams', 36000, -18],
    [1051, 'Tamika Allen', 58750, -9],
    [1029, 'Garfield Chambers', 22500, -45],
    [1033, 'Craig Dixon', 27800, -30],
    [1035, 'Latoya Stewart', 61000, -27],
    [1044, 'Damion Robinson', 18900, -12],
    [1049, 'Jason Wong', 73400, -6]
  ];

  /* Open follow-ups: [client, title, channel, owner, day, time, extra] */
  var OPEN = [
    ['Marsha Brown', 'Call about invoice 1042', 'phone', 'you', -2, '10:00', { invoice: 1042 }],
    ['Devon Clarke', 'Send revised quote', 'email', 'shanice', -1, '14:00'],
    ['Kerry-Ann Lewis', 'Confirm Thursday install', 'whatsapp', 'you', 0, '11:00'],
    ['Omar Grant', 'Check in after the demo', 'phone', 'andre', 0, '14:30'],
    ['Tanya Reid', 'Renewal reminder', 'email', 'you', 0, '16:00', { value: 128000 }],
    /* Thursday */
    ['Jermaine Thompson', 'Send site photos', 'email', 'andre', 1, '09:30'],
    ['Sasha-Gaye Williams', 'Call about invoice 1047', 'phone', 'shanice', 1, '10:00', { invoice: 1047 }],
    ['Leon Francis', 'Confirm demo time', 'whatsapp', 'you', 1, '11:30'],
    ['Kadian Henry', 'Check in after the install', 'phone', 'andre', 1, '13:00'],
    ['Rohan Edwards', 'Send price list', 'email', 'shanice', 1, '15:00'],
    ['Simone Barrett', 'Renewal reminder', 'email', 'you', 1, '16:30', { value: 96000 }],
    /* Friday */
    ['Nadine Scott', 'Check payment', 'phone', 'you', 2, '10:00', { invoice: 1038 }],
    ['Christopher Gordon', 'Walk through the setup', 'meeting', 'andre', 2, '11:00'],
    ['Tamika Allen', 'Call about invoice 1051', 'phone', 'you', 2, '14:00', { invoice: 1051 }],
    ['Shelly-Ann Walker', 'Send menu board proof', 'whatsapp', 'shanice', 2, '15:30'],
    /* Saturday */
    ['Marlon Bailey', 'Set up the front desk', 'meeting', 'andre', 3, '10:30'],
    /* Next Monday */
    ['Dionne Harris', 'Renewal call', 'phone', 'you', 5, '10:00', { value: 150000 }]
  ];

  /* Follow-ups already done this week: [client, title, result, channel, owner, doneDay, doneAt] */
  var DONE = [
    ['Nadine Scott', 'Payment reminder', 'Called: paying Friday', 'phone', 'you', 0, '08:45'],
    ['Paul Wright', 'Send onboarding pack', 'Sent onboarding pack', 'email', 'andre', 0, '09:10'],
    /* Tuesday */
    ['Kerry-Ann Lewis', 'Confirm install date', 'WhatsApp: install moved to Thursday', 'whatsapp', 'you', -1, '16:10'],
    ['Sasha-Gaye Williams', 'Remind about invoice 1047', 'Emailed a reminder for invoice 1047', 'email', 'shanice', -1, '09:15'],
    ['Leon Francis', 'Call back', 'Call: wants a demo', 'phone', 'you', -1, '11:00'],
    ['Rohan Edwards', 'Measure the counter', 'Visited: measured the counter', 'meeting', 'shanice', -1, '14:20'],
    ['Tanya Reid', 'Send renewal quote', 'Emailed the renewal quote', 'email', 'you', -1, '10:30'],
    ['Paul Wright', 'Get the contract signed', 'Contract signed', 'meeting', 'andre', -1, '12:00'],
    ['Christopher Gordon', 'Call about a walkthrough', 'Call: booked a walkthrough', 'phone', 'andre', -1, '15:45'],
    ['Shelly-Ann Walker', 'Send draft menu board', 'WhatsApp: sent draft menu board', 'whatsapp', 'shanice', -1, '17:00'],
    /* Monday */
    ['Devon Clarke', 'Call about the quote', 'Call: wants a revised quote', 'phone', 'shanice', -2, '11:20'],
    ['Omar Grant', 'Run the demo', 'Ran the demo at the shop', 'meeting', 'andre', -2, '15:00'],
    ['Simone Barrett', 'Email renewal details', 'Emailed renewal details', 'email', 'you', -2, '10:05'],
    ['Jermaine Thompson', 'Call about a site visit', 'Call: site visit booked', 'phone', 'andre', -2, '09:40'],
    ['Kadian Henry', 'Install and train staff', 'Installed and trained staff', 'meeting', 'andre', -2, '13:30']
  ];

  /* Reports: last 12 complete weeks, oldest first */
  var WEEKS = [[19, 9], [23, 8], [23, 7], [28, 6], [27, 6], [31, 5], [30, 5], [33, 4], [34, 4], [33, 3], [37, 3], [32, 2]];
  var REPORT_PERIODS = {
    12: {
      team: [['you', 168, 91], ['shanice', 131, 84], ['andre', 113, 76]],
      paid: 1840000,
      reply: [['WhatsApp', 2.1], ['Phone', 4.0], ['Email', 19]]
    },
    4: {
      team: [['you', 60, 95], ['shanice', 48, 92], ['andre', 40, 88]],
      paid: 710000,
      reply: [['WhatsApp', 1.8], ['Phone', 3.6], ['Email', 17]]
    }
  };

  function mins(s) { var p = s.split(':'); return +p[0] * 60 + +p[1]; }
  function phoneFor(i) {
    var a = 200 + (i * 47) % 700;
    var b = (1000 + (i * 7919) % 9000);
    return '876-' + a + '-' + b;
  }

  function build() {
    var clients = [], byName = {};
    CLIENTS.forEach(function (r, i) {
      var name = r[0] + ' ' + r[1];
      var tip = TIPS[name];
      if (!tip) {
        tip = TIP_TEMPLATES[(i * 5) % TIP_TEMPLATES.length]
          .replace('{F}', r[0]).replace('{a}', String(3 + i % 2)).replace('{b}', String(4 + i % 2 + (i % 3 === 0 ? 1 : 0)));
      }
      var added = ADDED[name] || [-(45 + (i * 37) % 680), r[4]];
      var hist = (HISTORY[name] || []).map(function (h) { return { text: h[0], day: h[1], time: null, who: h[2] }; });
      if (!HISTORY[name] && !TIPS[name]) {
        hist.push({ text: HISTORY_TEMPLATES[(i * 7) % HISTORY_TEMPLATES.length], day: -(8 + (i * 13) % 50), time: null, who: r[4] });
      }
      hist.push({ text: 'Added as a client', day: added[0], time: null, who: added[1] });
      var c = {
        id: 'c' + (i + 1), first: r[0], last: r[1], company: r[2], area: r[3], owner: r[4],
        phone: phoneFor(i + 1), tip: tip, history: hist
      };
      clients.push(c);
      byName[name] = c;
    });

    var invoices = INVOICES.map(function (v) {
      var c = byName[v[1]];
      if (!byName[v[1]]) throw new Error('No client ' + v[1]);
      if (!HISTORY[v[1]]) c.history.unshift({ text: 'Emailed invoice ' + v[0], day: v[3], time: null, who: c.owner });
      return { no: v[0], clientId: c.id, amount: v[2], issued: v[3], paid: false };
    });

    var seq = 1, items = [];
    OPEN.forEach(function (r) {
      var c = byName[r[0]];
      if (!c) throw new Error('No client ' + r[0]);
      var x = r[6] || {};
      items.push({
        id: 'i' + seq++, clientId: c.id, title: r[1], channel: r[2], owner: r[3], day: r[4], time: mins(r[5]),
        status: 'open', invoice: x.invoice || null, value: x.value || null
      });
    });
    DONE.forEach(function (r) {
      var c = byName[r[0]];
      if (!c) throw new Error('No client ' + r[0]);
      var at = mins(r[6]);
      items.push({
        id: 'i' + seq++, clientId: c.id, title: r[1], channel: r[3], owner: r[4], day: r[5], time: at,
        status: 'done', doneDay: r[5], doneAt: at, result: r[2], invoice: null, value: null
      });
      c.history.push({ text: r[2], day: r[5], time: at, who: r[4] });
    });

    return {
      v: 4,
      seq: seq,
      clientSeq: clients.length + 1,
      clients: clients,
      invoices: invoices,
      items: items,
      settings: { start: 8 * 60, end: 17 * 60, defaultTime: 10 * 60, remind: 15, weekends: true }
    };
  }

  return { build: build, version: 4, weeks: WEEKS, periods: REPORT_PERIODS };
})();
