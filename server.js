import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dayjs from 'dayjs';

const app = express();
app.use(cors());

// Your Companies House API key
const API_KEY = '4202e72a-2ae8-4e8b-8820-7373283102d3'; // <<< Replace this with your real API key

// Helper function to get the start and end date for the past quarter
const getQuarterDateRange = () => {
  const today = dayjs();
  const startOfQuarter = today.subtract(3, 'months').startOf('month').format('YYYY-MM-DD');
  const endOfQuarter = today.subtract(3, 'months').endOf('month').format('YYYY-MM-DD');
  return { startOfQuarter, endOfQuarter };
};

// Helper function to calculate date range for companies incorporated 18-21 months ago
const getIncorporationDateRange = () => {
  const today = dayjs();
  const startOfPeriod = today.subtract(21, 'months').startOf('month').format('YYYY-MM-DD');
  const endOfPeriod = today.subtract(18, 'months').endOf('month').format('YYYY-MM-DD');
  return { startOfPeriod, endOfPeriod };
};

// Endpoint to fetch companies incorporated between 18-21 months ago and filed accounts in the last quarter
app.get('/quarterly-companies', async (req, res) => {
  try {
    const { startOfQuarter, endOfQuarter } = getQuarterDateRange();
    const { startOfPeriod, endOfPeriod } = getIncorporationDateRange();

    let allCompanies = [];
    let page = 1;
    let moreData = true;

    // Loop to handle pagination
    while (moreData) {
      const response = await axios.get(`https://api.company-information.service.gov.uk/advanced-search/companies`, {
        auth: {
          username: API_KEY,
          password: '',
        },
        params: {
          incorporation_date_from: startOfPeriod,
          incorporation_date_to: endOfPeriod,
          accounts_made_up_to_from: startOfQuarter,
          accounts_made_up_to_to: endOfQuarter,
          company_status: 'active',
          company_type: 'ltd',
          size: 100,  // Number of results per page
          page: page, // Pagination
        },
      });

      if (response.data.items.length > 0) {
        allCompanies = [...allCompanies, ...response.data.items];
        page++;
      } else {
        moreData = false;
      }
    }

    res.json(allCompanies);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching companies');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Quarterly Companies Proxy running on port ${PORT}`));
