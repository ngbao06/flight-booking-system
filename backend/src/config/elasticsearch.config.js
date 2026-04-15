import { Client } from '@elastic/elasticsearch'

const elasticSearch = new Client({
    node: 'http://localhost:9200'
});

// Kiểm tra kết nối
elasticSearch.ping()
    .then(() => console.log('Connected to Elasticsearch'))
    .catch((err) => console.error('Elasticsearch connection error:', err));

export default elasticSearch;