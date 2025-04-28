import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dayjs from 'dayjs';

const app = express();
app.use(cors());

// Your Companies House API Key
const API_KEY = '4202e72a-2ae8-4e8b-8820-7373283102d3'; // Replace with your real API key

// Endpoint to fetch companies that filed first accounts LAST MONTH and are less than 3 years old
app.get('/new-companies-monthly', async (req, res) => {
    try {
        const today = dayjs();

        // Calculate last month's start and end dates
        const lastMonthStart = today.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
        const lastMonthEnd = today.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

        console.log(`Searching for companies filed accounts between ${lastMonthStart} and ${lastMonthEnd}`);

        // Call Companies House API
        const response = await axios.get('https://api.company-information.service.gov.uk/advanced-search/companies', {
            auth: {
                username: API_KEY,
                password: ''
            },
            params: {
                company_status: 'active',
                company_type: 'ltd',
                incorporation_date_from: today.subtract(3, 'years').format('YYYY-MM-DD'), // Companies less than 3 years old
                size: 100
            }
        });

        console.log('API response:', response.data); // Print full response to inspect

        const companies = response.data.items || [];
        console.log(`Total companies found: ${companies.length}`);

        // Filter companies that meet all criteria
        const companiesWithFirstAccounts = companies.filter(company => {
            const accounts = company.accounts || {};
            const lastAccounts = accounts.last_accounts || {};

            // Skip if no 'made_up_to' date or company is older than 3 years
            if (!lastAccounts.made_up_to || !company.date_of_creation) return false;

            const madeUpToDate = dayjs(lastAccounts.made_up_to);
            const creationDate = dayjs(company.date_of_creation);
            console.log(`Checking company: ${company.company_name}, Last Accounts Date: ${madeUpToDate.format('YYYY-MM-DD')}, Creation Date: ${creationDate.format('YYYY-MM-DD')}`);

            // Check if company is less than 3 years old
            const isLessThan3YearsOld = creationDate.isAfter(today.subtract(3, 'years'));

            // Only include companies whose last accounts are within last month range AND are less than 3 years old
            return (
                madeUpToDate.isAfter(lastMonthStart) &&
                madeUpToDate.isBefore(lastMonthEnd) &&
                isLessThan3YearsOld
            );
        });

        console.log('Filtered companies:', companiesWithFirstAccounts); // Inspect filtered results
        res.json(companiesWithFirstAccounts);
    } catch (error) {
        console.error(error?.response?.data || error.message);
        res.status(500).send('Error fetching monthly new companies');
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Monthly New Companies Proxy running on port ${PORT}`));
