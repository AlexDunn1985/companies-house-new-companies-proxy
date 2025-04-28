import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dayjs from 'dayjs';

const app = express();
app.use(cors());

// Your Companies House API key
const API_KEY = process.env.COMPANIES_HOUSE_API_KEY; // Replace with your real API key

// Endpoint to fetch companies incorporated in the last 3 years and submitted their first set of accounts last month
app.get('/new-companies', async (req, res) => {
    try {
        const today = dayjs();
        const threeYearsAgo = today.subtract(3, 'year').startOf('year').format('YYYY-MM-DD');
        const lastMonthStart = today.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
        const lastMonthEnd = today.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

        // Call Companies House API to get companies
        const response = await axios.get(`https://api.company-information.service.gov.uk/advanced-search/companies`, {
            auth: {
                username: API_KEY,
                password: ''
            },
            params: {
                incorporation_date_from: threeYearsAgo, // Only companies incorporated in the last 3 years
                incorporation_date_to: today.format('YYYY-MM-DD'), // Up to today
                company_status: 'active',
                company_type: 'ltd',
                size: 100 // Adjust as necessary
            }
        });

        // Filter companies that have submitted their first set of accounts (in the last month)
        const companies = response.data.items.filter(company => {
            const accountsDate = company.accounts.first_accounts_date;
            if (accountsDate) {
                const accountDate = dayjs(accountsDate);
                return accountDate.isBetween(lastMonthStart, lastMonthEnd, null, '[]');
            }
            return false;
        });

        res.json(companies); // Return filtered companies
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching new companies');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`New Companies Proxy running on port ${PORT}`));
