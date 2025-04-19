
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface Sample {
  id: number;
  values: number[];
}

interface ChartData {
  index: number;
  mean: number;
}

const calculateControlLimits = (samples: Sample[]) => {
  // Calculate means for each sample
  const means = samples.map(sample => {
    const sum = sample.values.reduce((acc, val) => acc + val, 0);
    return sum / sample.values.length;
  });

  // Calculate ranges for each sample
  const ranges = samples.map(sample => {
    const max = Math.max(...sample.values);
    const min = Math.min(...sample.values);
    return max - min;
  });

  // Calculate overall mean (X-double-bar)
  const overallMean = means.reduce((acc, val) => acc + val, 0) / means.length;

  // Calculate average range (R-bar)
  const averageRange = ranges.reduce((acc, val) => acc + val, 0) / ranges.length;

  // Get A2 value based on sample size (using most common sample size)
  const sampleSize = samples[0].values.length;
  const A2 = getA2Value(sampleSize);

  // Calculate control limits
  const UCL = overallMean + (A2 * averageRange);
  const LCL = overallMean - (A2 * averageRange);

  return {
    means,
    CL: overallMean,
    UCL,
    LCL,
    averageRange,
  };
};

const getA2Value = (n: number): number => {
  const A2_VALUES: { [key: number]: number } = {
    2: 1.880,
    3: 1.023,
    4: 0.729,
    5: 0.577,
    6: 0.483,
    7: 0.419,
    8: 0.373,
    9: 0.337,
    10: 0.308,
  };
  return A2_VALUES[n] || 0.308; // Default to n=10 if not found
};

const isProcessInControl = (means: number[], UCL: number, LCL: number): boolean => {
  return means.every(mean => mean <= UCL && mean >= LCL);
};

const Index = () => {
  const [samples, setSamples] = useState<Sample[]>(
    Array.from({ length: 10 }, (_, i) => ({ id: i + 1, values: [] }))
  );
  const [chartData, setChartData] = useState<any>(null);
  const isMobile = useIsMobile();

  const handleSampleChange = (id: number, value: string) => {
    const values = value
      .split(",")
      .map(v => parseFloat(v.trim()))
      .filter(v => !isNaN(v));

    setSamples(prev =>
      prev.map(sample =>
        sample.id === id ? { ...sample, values } : sample
      )
    );
  };

  const calculateChart = () => {
    const validSamples = samples.filter(sample => sample.values.length > 0);
    if (validSamples.length < 2) {
      alert("Please enter at least 2 samples with valid data");
      return;
    }

    const { means, CL, UCL, LCL, averageRange } = calculateControlLimits(validSamples);
    const inControl = isProcessInControl(means, UCL, LCL);

    const data = means.map((mean, index) => ({
      index: index + 1,
      mean,
    }));

    setChartData({
      data,
      CL,
      UCL,
      LCL,
      inControl,
      averageRange,
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">X-Bar Chart Calculator</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Sample Data Input</h2>
          <ScrollArea className="h-[400px] w-full">
            <div className="space-y-4">
              {samples.map(sample => (
                <div key={sample.id} className="space-y-2">
                  <Label htmlFor={`sample-${sample.id}`}>
                    Sample {sample.id}
                  </Label>
                  <Input
                    id={`sample-${sample.id}`}
                    placeholder="Enter values (e.g., 10,20,30,40)"
                    onChange={(e) => handleSampleChange(sample.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
          <Button 
            className="w-full mt-4"
            onClick={calculateChart}
          >
            Calculate X Chart
          </Button>
        </Card>

        {/* Results Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          {chartData && (
            <div className="space-y-6">
              <div className="space-y-2">
                <p><strong>Center Line (CL):</strong> {chartData.CL.toFixed(2)}</p>
                <p><strong>Upper Control Limit (UCL):</strong> {chartData.UCL.toFixed(2)}</p>
                <p><strong>Lower Control Limit (LCL):</strong> {chartData.LCL.toFixed(2)}</p>
                <p><strong>Average Range (R̄):</strong> {chartData.averageRange.toFixed(2)}</p>
                <p className={chartData.inControl ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                  Process is {chartData.inControl ? "in statistical control" : "not in statistical control"}
                </p>
              </div>

              <div className="mt-4 overflow-x-auto">
                <LineChart
                  width={isMobile ? 300 : 500}
                  height={300}
                  data={chartData.data}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" label={{ value: "Sample Number", position: "bottom" }} />
                  <YAxis label={{ value: "Sample Mean", angle: -90, position: "left" }} />
                  <Tooltip />
                  <ReferenceLine y={chartData.UCL} stroke="red" strokeDasharray="3 3" label="UCL" />
                  <ReferenceLine y={chartData.CL} stroke="blue" label="CL" />
                  <ReferenceLine y={chartData.LCL} stroke="red" strokeDasharray="3 3" label="LCL" />
                  <Line
                    type="monotone"
                    dataKey="mean"
                    stroke="#8884d8"
                    dot={{ stroke: '#8884d8', strokeWidth: 2 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Constants Table */}
      <Card className="mt-6 p-6">
        <h2 className="text-xl font-semibold mb-4">Control Chart Constants</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left">Sample Size (n)</th>
                <th className="p-2 text-left">A2</th>
                <th className="p-2 text-left">D3</th>
                <th className="p-2 text-left">D4</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries({
                2: { A2: 1.880, D3: 0, D4: 3.267 },
                3: { A2: 1.023, D3: 0, D4: 2.574 },
                4: { A2: 0.729, D3: 0, D4: 2.282 },
                5: { A2: 0.577, D3: 0, D4: 2.114 },
                6: { A2: 0.483, D3: 0, D4: 2.004 },
                7: { A2: 0.419, D3: 0.076, D4: 1.924 },
                8: { A2: 0.373, D3: 0.136, D4: 1.864 },
                9: { A2: 0.337, D3: 0.184, D4: 1.816 },
                10: { A2: 0.308, D3: 0.223, D4: 1.777 },
              }).map(([n, constants]) => (
                <tr key={n} className="border-t">
                  <td className="p-2">{n}</td>
                  <td className="p-2">{constants.A2}</td>
                  <td className="p-2">{constants.D3}</td>
                  <td className="p-2">{constants.D4}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Index;
