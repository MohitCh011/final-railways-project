import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const data = [
    { name: 'Mon', detections: 12 },
    { name: 'Tue', detections: 19 },
    { name: 'Wed', detections: 15 },
    { name: 'Thu', detections: 22 },
    { name: 'Fri', detections: 30 },
    { name: 'Sat', detections: 25 },
    { name: 'Sun', detections: 18 },
];

const pieData = [
    { name: 'Cracks', value: 35 },
    { name: 'Broken Rail', value: 15 },
    { name: 'Vegetation', value: 25 },
    { name: 'Loose Bolts', value: 25 },
];

const COLORS = ['#4facfe', '#ff1744', '#00e676', '#ffc400'];

const AnalyticsChart = () => {
    return (
        <div className="analytics-container fade-in">
            <div className="chart-card main-chart">
                <h3>Detection Trends (Weekly)</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorDet" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                            <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--bg-glass)',
                                    borderColor: 'var(--border-subtle)',
                                    borderRadius: '12px',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="detections"
                                stroke="var(--accent-primary)"
                                fillOpacity={1}
                                fill="url(#colorDet)"
                                strokeWidth={3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="chart-card dist-chart">
                <h3>Defect Distribution</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--bg-glass)',
                                    borderColor: 'var(--border-subtle)',
                                    borderRadius: '12px'
                                }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsChart;
