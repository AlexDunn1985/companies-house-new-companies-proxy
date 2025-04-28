import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dayjs from 'dayjs';

const app = express();
app.use(cors());

// Your Companies House API key
const API_KEY = '4202e72a-2ae8-4e8b-8820-7373283102d3'; // <<< Replace this with your real API key

// Endpoint to fetch companies submitting first accounts last month
app.get('/new-companies', async (req, res) => {
    try {
        const today = dayjs();
        
        // Calculate the start and end date for last month
        const lastMonthStart = today.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
        const lastMonthEnd = today.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

        // Calculate the date range for companies' first accounts submission (21 months after incorporation)
        const firstAccountsStart = today.subtract(22, 'months').startOf('month').format('YYYY-MM-DD');
        const firstAccountsEnd = today.subtract(22, 'months').endOf('month').format('YYYY-MM-DD');

        // Call Companies House API
        const response = await axios.get(`https://api.company-information.service.gov.uk/advanced-search/companies`, {
            auth: {
                username: API_KEY,
                password: ''
            },
            params: {
                incorporation_date_from: firstAccountsStart, // Incorporation date range
                incorporation_date_to: firstAccountsEnd,
                company_status: 'active',
                company_type: 'ltd',
                size: 100
            }
        });

        // Filter companies that have filed first set of accounts
        const companies = response.data.items.filter(company => {
            // You'll need to check the accounts data here to confirm it's the first accounts submitted
            // Example: check if there's an "accounts" field or other criteria to indicate first submission
            return company.accounts && company.accounts.filing_date; // Adjust based on the actual response format
        });

        res.json(companies);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching new companies');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`New Companies Proxy running on port ${PORT}`));

