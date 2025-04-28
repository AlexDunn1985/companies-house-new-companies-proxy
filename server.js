import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dayjs from 'dayjs';

const app = express();
app.use(cors());

// Your Companies House API key
const API_KEY = process.env.COMPANIES_HOUSE_API_KEY; // <<< Replace this with your real API key

// Endpoint to fetch companies with first accounts filed last month
app.get('/new-companies', async (req, res) => {
    try {
        const today = dayjs();
        const lastMonthStart = today.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
        const lastMonthEnd = today.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

        const threeYearsAgo = today.subtract(3, 'years').startOf('year').format('YYYY-MM-DD');

        // Call Companies House API
        const response = await axios.get(`https://api.company-information.service.gov.uk/advanced-search/companies`, {
            auth: {
                username: API_KEY,
                password: ''
            },
            params: {
                incorporation_date_from: threeYearsAgo,
                incorporation_date_to: today.format('YYYY-MM-DD'),
                company_status: 'active',
                company_type: 'ltd',
                size: 100
            }
        });

        // Filter companies based on creation date and last accounts made up to the last month
        const companies = response.data.items.filter(company => {
            // Check if company creation date is within the last 3 years
            const creationDateValid = dayjs(company.date_of_creation).isAfter(threeYearsAgo);
            
            // Check if company has made accounts up to last month
            const lastAccountsValid = company.last_accounts && company.last_accounts.date_of_accounts 
                && dayjs(company.last_accounts.date_of_accounts).isBefore(lastMonthEnd) 
                && dayjs(company.last_accounts.date_of_accounts).isAfter(lastMonthStart);

            return creationDateValid && lastAccountsValid;
        });

        res.json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).send('Error fetching companies');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`New Companies Proxy running on port ${PORT}`));



