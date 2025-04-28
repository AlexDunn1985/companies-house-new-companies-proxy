import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dayjs from 'dayjs';

const app = express();
app.use(cors());

// ✅ Your real Companies House API Key
const API_KEY = '4202e72a-2ae8-4e8b-8820-7373283102d3'; // <<< your real API key

// ✅ Endpoint to fetch companies that filed first accounts last week
app.get('/new-companies-weekly', async (req, res) => {
    try {
        const today = dayjs();

        // Calculate last week's Monday and Sunday
        const lastMonday = today.subtract(today.day() + 6, 'day').startOf('day'); // .day() gives 0 (Sunday) to 6 (Saturday)
        const lastSunday = lastMonday.add(6, 'day').endOf('day');

        const lastMondayStr = lastMonday.format('YYYY-MM-DD');
        const lastSundayStr = lastSunday.format('YYYY-MM-DD');

        console.log(`Looking for filings from ${lastMondayStr} to ${lastSundayStr}`);

        // Call Companies House API
        const response = await axios.get('https://api.company-information.service.gov.uk/advanced-search/companies', {
            auth: {
                username: API_KEY,
                password: ''
            },
            params: {
                company_status: 'active',
                company_type: 'ltd',
                size: 100
            }
        });

        const companies = response.data.items || [];

        // Filter companies whose first accounts were made up to last week
        const firstAccountsLastWeek = companies.filter(company => {
            const accounts = company.accounts || {};
            const madeUpToDate = accounts.last_accounts?.made_up_to;

            if (!madeUpToDate) return false;

            const madeUpToDateDate = dayjs(madeUpToDate);

            return madeUpToDateDate.isAfter(lastMonday) && madeUpToDateDate.isBefore(lastSunday);
        });

        res.json(firstAccountsLastWeek);

    } catch (error) {
        console.error(error?.response?.data || error.message);
        res.status(500).send('Error fetching weekly new companies');
    }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Weekly New Companies Proxy running on port ${PORT}`));
