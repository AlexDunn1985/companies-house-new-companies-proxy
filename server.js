import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dayjs from 'dayjs';

const app = express();
app.use(cors());

const API_KEY = '4202e72a-2ae8-4e8b-8820-7373283102d3'; // Replace correctly

// Endpoint to fetch companies that:
// - Incorporated less than 3 years ago
// - Filed accounts last month
// - Are active
// - Are Ltd
app.get('/new-companies', async (req, res) => {
  try {
    const today = dayjs();
    const threeYearsAgo = today.subtract(3, 'year').format('YYYY-MM-DD');
    const lastMonthStart = today.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
    const lastMonthEnd = today.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

    const response = await axios.get('https://api.company-information.service.gov.uk/advanced-search/companies', {
      auth: {
        username: API_KEY,
        password: ''
      },
      params: {
        company_status: 'active',
        company_type: 'ltd',
        incorporated_from: threeYearsAgo, // Companies created in the last 3 years
        accounts_made_up_to_from: lastMonthStart, // Accounts submitted during last month
        accounts_made_up_to_to: lastMonthEnd,
        size: 100
      }
    });

    const companies = response.data.items || [];

    console.log(`Found ${companies.length} companies`);

    // ✅ Send back the data properly
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error.message);
    res.status(500).send('Error fetching companies');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
