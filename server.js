import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dayjs from 'dayjs';

const app = express();
app.use(cors());

// Your Companies House API key
const API_KEY = '4202e72a-2ae8-4e8b-8820-7373283102d3'; // <<< replace with your real API key

// Endpoint to fetch companies that filed their FIRST set of accounts yesterday
app.get('/new-companies-daily', async (req, res) => {
    try {
        const today = dayjs();
        const yesterdayStart = today.subtract(1, 'day').startOf('day').format('YYYY-MM-DD');
        const yesterdayEnd = today.subtract(1, 'day').endOf('day').format('YYYY-MM-DD');

        // Step 1: Search for companies that have filed accounts recently
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

        // Step 2: Filter companies that filed first set of accounts yesterday
        const firstAccountsYesterday = companies.filter(company => {
            const accounts = company.accounts || {};
            const nextAccountsDue = accounts.next_accounts?.due_on;
            const madeUpToDate = accounts.last_accounts?.made_up_to;

            if (!nextAccountsDue || !madeUpToDate) return false;

            const madeUpToDateDate = dayjs(madeUpToDate);

            return madeUpToDateDate.isAfter(yesterdayStart) && madeUpToDateDate.isBefore(yesterdayEnd);
        });

        res.json(firstAccountsYesterday);

    } catch (error) {
        console.error(error?.response?.data || error.message);
        res.status(500).send('Error fetching daily new companies');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Daily New Companies Proxy running on port ${PORT}`));


