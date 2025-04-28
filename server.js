import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dayjs from 'dayjs';

const app = express();
app.use(cors());

// Companies House API Key
const API_KEY = '4202e72a-2ae8-4e8b-8820-7373283102d3'; // <<< PUT YOUR API KEY

// Endpoint to fetch companies with accounts made up last month
app.get('/new-companies-monthly', async (req, res) => {
    try {
        const today = dayjs();
        const lastMonthStart = today.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
        const lastMonthEnd = today.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

        // Fetch all companies
        const response = await axios.get('https://api.company-information.service.gov.uk/advanced-search/companies', {
            auth: {
                username: API_KEY,
                password: ''
            },
            params: {
                company_status: 'active',
                company_type: 'ltd',
                incorporation_date_from: dayjs().subtract(3, 'years').format('YYYY-MM-DD'),
                incorporation_date_to: today.format('YYYY-MM-DD'),
                size: 100
            }
        });

        const companies = response.data.items || [];

        // Now filter the companies based on 'last_accounts.made_up_to' last month
        const filteredCompanies = companies.filter(company => {
            const madeUpTo = company.accounts?.last_accounts?.made_up_to;
            if (!madeUpTo) return false;

            const madeUpToDate = dayjs(madeUpTo);
            return madeUpToDate.isAfter(lastMonthStart) && madeUpToDate.isBefore(lastMonthEnd);
        });

        console.log('Filtered Companies:', filteredCompanies.length);
        // THIS IS IMPORTANT: Send the filtered companies to the web page / excel
        res.json(filteredCompanies);

    } catch (error) {
        console.error('Error fetching companies:', error.message);
        res.status(500).send('Server Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

