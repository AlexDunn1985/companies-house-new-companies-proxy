import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dayjs from 'dayjs';

const app = express();
app.use(cors());

// ✅ Your real Companies House API Key
const API_KEY = '4202e72a-2ae8-4e8b-8820-7373283102d3'; // <<< your real API key

// ✅ Endpoint to fetch companies that filed first accounts LAST MONTH
app.get('/new-companies-monthly', async (req, res) => {
    try {
        const today = dayjs();

        // Calculate last month's start and end dates
        const lastMonthStart = today.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
        const lastMonthEnd = today.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

        console.log(`Looking for filings between ${lastMonthStart} and ${lastMonthEnd}`);

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

        // Filter companies whose FIRST accounts were made up last month
        const companiesWithFirstAccounts = companies.filter(company => {
            const accounts = company.accounts || {};
            const lastAccounts = accounts.last_accounts || {};

            if (!lastAccounts.made_up_to || accounts.overdue) return false;

            const madeUpToDate = dayjs(lastAccounts.made_up_to);

            return madeUpToDate.isAfter(lastMonthStart) && madeUpToDate.isBefore(lastMonthEnd);
        });

        res.json(companiesWithFirstAccounts);

    } catch (error) {
        console.error(error?.response?.data || error.message);
        res.status(500).send('Error fetching monthly new companies');
    }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Monthly New Companies Proxy running on port ${PORT}`));

