import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dayjs from 'dayjs';

const app = express();
app.use(cors());

// Your Companies House API key
const API_KEY = '4202e72a-2ae8-4e8b-8820-7373283102d3'; // <<< Replace with your actual API key

// Endpoint to fetch companies incorporated last month
app.get('/new-companies', async (req, res) => {
    try {
        const today = dayjs();
        const lastMonthStart = today.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
        const lastMonthEnd = today.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

        // Call Companies House Advanced Search API
        const response = await axios.get('https://api.company-information.service.gov.uk/advanced-search/companies', {
            auth: {
                username: API_KEY,
                password: ''
            },
            params: {
                incorporated_from: lastMonthStart,
                incorporated_to: lastMonthEnd,
                company_status: 'active',
                company_type: 'ltd',
                items_per_page: 100
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).send('Error fetching new companies');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`New Companies Proxy running on port ${PORT}`));

