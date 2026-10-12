/**
 * Generates src/testdata/ServiceRequestTestData.xlsx — 50 unique rows for the
 * FSM Service Request form. Re-run with: node scripts/generate-service-request-data.js
 */
const path = require('path');
const ExcelJS = require('exceljs');

const USER_NAME = 'samcurran';
const SERVICE_TYPE = 'Install';
const SERVICE_REQUEST = 'Wifi';
const EQUIPMENT_TYPE = 'WiFi Router';
const FIRST_PREFERRED_DATE = new Date(2026, 9, 15); // 15-10-2026

const customerNames = [
  'Arun Kumar', 'Bala Murugan', 'Chandra Sekar', 'Deepa Lakshmi', 'Elango Raja',
  'Gowri Shankar', 'Hari Prasad', 'Indira Devi', 'Jeeva Nathan', 'Karthik Raja',
  'Lakshmi Priya', 'Mani Kandan', 'Nandhini Rani', 'Pandi Selvam', 'Ravi Chandran',
  'Saranya Devi', 'Tamil Selvan', 'Uma Maheswari', 'Vignesh Kumar', 'Yamuna Devi',
  'Anbu Selvan', 'Bharathi Raja', 'Divya Bharathi', 'Ganesh Babu', 'Kavitha Rani',
  'Muthu Kumar', 'Prabhu Deva', 'Revathi Mohan', 'Senthil Nathan', 'Vasanth Kumar',
  'Aishwarya Ravi', 'Dinesh Karthik', 'Janani Sundar', 'Kannan Pandian', 'Meena Kumari',
  'Naveen Raj', 'Priya Dharshini', 'Rajesh Kannan', 'Sathya Moorthy', 'Thenmozhi Arasu',
  'Vetri Maran', 'Abinaya Sri', 'Gokul Krishnan', 'Harini Saravanan', 'Mohan Raj',
  'Pavithra Selvi', 'Ramya Krishnan', 'Suresh Pandian', 'Vimala Devi', 'Yogesh Waran',
];

// Unique service addresses, all within Madurai district.
const serviceAddresses = [
  'Meenakshi Amman Temple, Madurai Main, Madurai, Tamil Nadu 625001',
  'Thirumalai Nayakkar Mahal, Palace Road, Madurai, Tamil Nadu 625001',
  'Gandhi Memorial Museum, Tamukkam, Madurai, Tamil Nadu 625020',
  'Madurai Junction Railway Station, Madurai, Tamil Nadu 625001',
  'Mattuthavani Integrated Bus Terminus, Madurai, Tamil Nadu 625007',
  'Periyar Bus Stand, Madurai, Tamil Nadu 625001',
  'Arapalayam Bus Stand, Arapalayam, Madurai, Tamil Nadu 625016',
  'Government Rajaji Hospital, Panagal Road, Madurai, Tamil Nadu 625020',
  'Madurai Kamaraj University, Palkalai Nagar, Madurai, Tamil Nadu 625021',
  'The American College, Goripalayam, Madurai, Tamil Nadu 625002',
  'Thiagarajar College of Engineering, Thiruparankundram, Madurai, Tamil Nadu 625015',
  'Thiruparankundram Murugan Temple, Thiruparankundram, Madurai, Tamil Nadu 625005',
  'Vandiyur Mariamman Teppakulam, Madurai, Tamil Nadu 625009',
  'Madurai Airport, Avaniyapuram, Madurai, Tamil Nadu 625022',
  'Anna Nagar Main Road, Anna Nagar, Madurai, Tamil Nadu 625020',
  'K.K. Nagar 80 Feet Road, K.K. Nagar, Madurai, Tamil Nadu 625020',
  'S.S. Colony Main Road, S.S. Colony, Madurai, Tamil Nadu 625010',
  'Bypass Road, Madurai, Tamil Nadu 625010',
  'Tallakulam Post Office, Tallakulam, Madurai, Tamil Nadu 625002',
  'Simmakkal Market, Simmakkal, Madurai, Tamil Nadu 625001',
  'Sellur Main Road, Sellur, Madurai, Tamil Nadu 625002',
  'Villapuram Housing Board, Villapuram, Madurai, Tamil Nadu 625012',
  'Palanganatham Junction, Palanganatham, Madurai, Tamil Nadu 625003',
  'Thirunagar 3rd Stop, Thirunagar, Madurai, Tamil Nadu 625006',
  'Ponmeni Main Road, Ponmeni, Madurai, Tamil Nadu 625016',
  'Kalavasal Junction, Kalavasal, Madurai, Tamil Nadu 625016',
  'Vilangudi Bus Stop, Vilangudi, Madurai, Tamil Nadu 625018',
  'Koodal Nagar Railway Station, Koodal Nagar, Madurai, Tamil Nadu 625018',
  'Iyer Bungalow Main Road, Iyer Bungalow, Madurai, Tamil Nadu 625014',
  'Narayanapuram Main Road, Narayanapuram, Madurai, Tamil Nadu 625014',
  'Pudur Bus Stand, Pudur, Madurai, Tamil Nadu 625007',
  'Anaiyur Main Road, Anaiyur, Madurai, Tamil Nadu 625017',
  'Avaniyapuram Bus Stand, Avaniyapuram, Madurai, Tamil Nadu 625012',
  'Keelavasal, Madurai, Tamil Nadu 625001',
  'Vilakkuthoon, Madurai, Tamil Nadu 625001',
  'Arasaradi Main Road, Arasaradi, Madurai, Tamil Nadu 625016',
  'Bibikulam Main Road, Bibikulam, Madurai, Tamil Nadu 625002',
  'Chokkikulam, Madurai, Tamil Nadu 625002',
  'Mahatma Gandhi Nagar, Madurai, Tamil Nadu 625014',
  'Kochadai Main Road, Kochadai, Madurai, Tamil Nadu 625016',
  'Nagamalai Pudukottai, Madurai, Tamil Nadu 625019',
  'Samayanallur Main Road, Samayanallur, Madurai, Tamil Nadu 625402',
  'Paravai Bus Stop, Paravai, Madurai, Tamil Nadu 625402',
  'Othakadai Main Road, Othakadai, Madurai, Tamil Nadu 625107',
  'Uthangudi, Madurai, Tamil Nadu 625107',
  'Thirumangalam Bus Stand, Thirumangalam, Madurai, Tamil Nadu 625706',
  'Melur Bus Stand, Melur, Madurai, Tamil Nadu 625106',
  'Alagar Kovil Temple, Alagar Kovil, Madurai, Tamil Nadu 625301',
  'Karuppayurani Main Road, Karuppayurani, Madurai, Tamil Nadu 625020',
  'Harveypatti, Thiruparankundram, Madurai, Tamil Nadu 625005',
];

const landmarks = [
  'Near Temple', 'Opposite Bus Stop', 'Near Government School', 'Behind Post Office',
  'Near Petrol Bunk', 'Opposite Bank', 'Near Water Tank', 'Next to Church',
  'Near Railway Gate', 'Opposite Hospital',
];

const descriptions = [
  'Wifi service',
  'New WiFi router installation for home',
  'WiFi connection setup for office',
  'Install WiFi router and configure network',
  'Wifi installation for new connection',
];

const pad = (n) => String(n).padStart(2, '0');
const formatDate = (d) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;

function buildRows() {
  return customerNames.map((name, i) => {
    const date = new Date(FIRST_PREFERRED_DATE);
    date.setDate(date.getDate() + i);
    const minutes = 9 * 60 + (i % 18) * 30; // 09:00 .. 17:30 in 30-min slots
    return {
      testId: `SR_TD_${String(i + 1).padStart(3, '0')}`,
      customerName: name,
      userName: USER_NAME,
      emailId: `${name.replace(/\s+/g, '').toLowerCase()}@yopmail.com`,
      phoneNumber: String(9876500000 + (i + 1) * 137),
      serviceAddress: serviceAddresses[i],
      serviceType: SERVICE_TYPE,
      serviceRequest: SERVICE_REQUEST,
      equipmentType: EQUIPMENT_TYPE,
      landmark: landmarks[i % landmarks.length],
      serviceDescription: descriptions[i % descriptions.length],
      preferredDate: formatDate(date),
      preferredTime: `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`,
    };
  });
}

function assertUnique(rows, key) {
  const values = rows.map((r) => r[key]);
  if (new Set(values).size !== values.length) {
    throw new Error(`Duplicate values found in "${key}"`);
  }
}

async function main() {
  const rows = buildRows();
  if (rows.length !== 50) throw new Error(`Expected 50 rows, got ${rows.length}`);
  ['testId', 'customerName', 'emailId', 'phoneNumber', 'serviceAddress'].forEach((k) => assertUnique(rows, k));

  const workbook = new ExcelJS.Workbook();
  const font = { name: 'Arial', size: 10 };

  const sheet = workbook.addWorksheet('ServiceRequestData', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = [
    { header: 'Test ID', key: 'testId', width: 12 },
    { header: 'Customer Name', key: 'customerName', width: 20 },
    { header: 'User Name', key: 'userName', width: 12 },
    { header: 'Email ID', key: 'emailId', width: 30 },
    { header: 'Phone Number', key: 'phoneNumber', width: 15 },
    { header: 'Service Address', key: 'serviceAddress', width: 72 },
    { header: 'Service Type', key: 'serviceType', width: 13 },
    { header: 'Service Request', key: 'serviceRequest', width: 15 },
    { header: 'Equipment Type', key: 'equipmentType', width: 15 },
    { header: 'Landmark (Address)', key: 'landmark', width: 24 },
    { header: 'Service Description', key: 'serviceDescription', width: 42 },
    { header: 'Preferred Date', key: 'preferredDate', width: 15 },
    { header: 'Preferred Time', key: 'preferredTime', width: 14 },
  ];
  sheet.addRows(rows);
  sheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.font = rowNumber === 1 ? { ...font, bold: true, color: { argb: 'FFFFFFFF' } } : font;
      // Store everything as text so phone numbers, dates and times keep their exact form.
      cell.numFmt = '@';
      if (rowNumber === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
      }
    });
  });
  sheet.autoFilter = { from: 'A1', to: 'M1' };

  const notes = workbook.addWorksheet('Notes');
  notes.columns = [{ width: 22 }, { width: 90 }];
  [
    ['Field', 'Rule / assumption'],
    ['Customer Name', 'Unique per row (user requirement).'],
    ['User Name', 'Always "samcurran" (user requirement).'],
    ['Email ID', 'Customer name without spaces, lowercase, + "@yopmail.com" (user requirement).'],
    ['Service Address', 'Unique per row, all within Madurai district (user requirement).'],
    ['Service Type', 'Always "Install" (user requirement).'],
    ['Service Request', 'Always "Wifi" (user requirement).'],
    ['Phone Number', 'Assumption: unique 10-digit Indian mobile numbers (98765xxxxx); not real subscribers.'],
    ['Equipment Type', 'Assumption: "WiFi Router", matching the sample form.'],
    ['Landmark / Description', 'Assumption: rotated sample values; not required to be unique.'],
    ['Preferred Date', 'Assumption: DD-MM-YYYY text, one day apart starting 15-10-2026 (future dates).'],
    ['Preferred Time', 'Assumption: HH:MM 24-hour text, 30-minute slots between 09:00 and 17:30.'],
    ['Regenerate', 'node scripts/generate-service-request-data.js'],
  ].forEach((r, i) => {
    const row = notes.addRow(r);
    row.font = i === 0 ? { ...font, bold: true } : font;
  });

  const outFile = path.resolve(__dirname, '../src/testdata/ServiceRequestTestData.xlsx');
  await workbook.xlsx.writeFile(outFile);
  console.log(`Wrote ${rows.length} rows to ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
