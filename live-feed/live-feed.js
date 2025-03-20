class LiveFeed extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.fetchData();

        // 获取 `refresh-interval` 属性，并转换为毫秒
        const refreshInterval = (parseInt(this.getAttribute('refresh-interval'), 10) || 15) * 1000;

        // 刷新间隔统一为从属性获取的值或默认的15秒
        setInterval(() => {
            this.fetchData();
        }, refreshInterval);
    }

    async fetchData() {
        const type = this.getAttribute('type');
        let data;
        try {
            switch (type) {
                case 'weather':
                    data = await this.fetchWeather();
                    break;
                case 'news':
                    data = await this.fetchNewsData();
                    break;
                case 'sensor':
                    data = this.fetchSensorData();
                    break;
                default:
                    data = { title: '未知类型', description: '无法加载数据。' };
            }
            this.render(data);
        } catch (err) {
            console.error('获取数据失败:', err);
            this.render({ title: '错误', description: '无法加载数据。' });
        }
    }

    async fetchWeather() {
        try {
            const response = await fetch('https://wttr.in/Jinan,Licheng?format=j1');
            if (!response.ok) throw new Error('Weather API error');
            const data = await response.json();
            if (data.current_condition && data.current_condition.length > 0) {
                const condition = data.current_condition[0];
                return {
                    title: "济南历城区天气",
                    description: `🌡 温度: ${condition.temp_C}°C <br> ☁ 天气: ${condition.weatherDesc[0].value}`,
                };
            }
            return { title: '天气', description: '无数据' };
        } catch (err) {
            console.error('获取天气数据失败:', err);
            return { title: '天气', description: '无法加载数据' };
        }
    }

    async fetchNewsData() {
        try {
            const response = await fetch('./hotsearch.json');
            if (!response.ok) throw new Error('News API error');
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error('数据格式错误');
            const hotsearchList = data.map(item => `<li><a href="${item.link}" target="_blank">${item.title}</a></li>`).join('');
            return {
                title: "最新新闻",
                description: `<ul>${hotsearchList}</ul>`,
            };
        } catch (err) {
            console.error('获取新闻数据失败:', err);
            return { title: '新闻', description: '无法加载数据' };
        }
    }

    fetchSensorData() {
        const sensorData = {
            temperature: (20 + Math.random() * 10).toFixed(1) + "°C",
            humidity: (40 + Math.random() * 20).toFixed(1) + "%",
            airQuality: (50 + Math.random() * 50).toFixed(0) + " AQI"
        };

        return {
            title: "传感器数据",
            description: `🌡 温度: ${sensorData.temperature} <br> 💧 湿度: ${sensorData.humidity} <br> 🍃 空气质量: ${sensorData.airQuality}`,
        };
    }

    render(data = { title: '加载中...', description: '请稍等...' }) {
        const { title, description } = data;
        this.shadowRoot.innerHTML = `
            <style>
                .live-feed-card-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .live-feed-card {
                    border: 1px solid #ccc;
                    border-radius: 10px;
                    padding: 15px;
                    width: calc(33.33% - 20px);
                    box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.1);
                    background: #f9f9f9;
                    transition: transform 0.3s ease-in-out;
                }
                .live-feed-card:hover {
                    transform: scale(1.05);
                }
                .live-feed-card h3 {
                    margin-top: 0;
                    font-size: 20px;
                    color: #2c3e50;
                }
                .live-feed-card p {
                    font-size: 14px;
                    color: #555;
                }
            </style>
            <div class="live-feed-card-container">
                <div class="live-feed-card">
                    <h3>${title}</h3>
                    <p>${description}</p>
                </div>
            </div>
        `;
    }
}

customElements.define('live-feed', LiveFeed);
