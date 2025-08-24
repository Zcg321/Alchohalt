/** Minimal recharts stubs for tests */
import React from "react";
const N = (n: string) => Object.assign((props: any) => React.createElement("div", props), { displayName: n });
export const ResponsiveContainer = N("ResponsiveContainer");
export const LineChart = N("LineChart");
export const Line = N("Line");
export const CartesianGrid = N("CartesianGrid");
export const XAxis = N("XAxis");
export const YAxis = N("YAxis");
export const Tooltip = N("Tooltip");
export const Legend = N("Legend");
export const PieChart = N("PieChart");
export const Pie = N("Pie");
export const Cell = N("Cell");
export const BarChart = N("BarChart");
export const Bar = N("Bar");
export const AreaChart = N("AreaChart");
export const Area = N("Area");
export default {};
