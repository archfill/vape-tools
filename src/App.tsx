import { useMemo, useState } from "react";

const resistanceValues = [
  0.08, 0.09, 0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.18, 0.2, 0.22, 0.25,
  0.28, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.7, 0.8, 0.9, 1,
];

const voltageValues = [4.2, 3.9, 3.7, 3.5, 3.2];
const cdrOptions = [15, 20, 25, 30, 35, 40];

type TableCell = {
  amps: number;
  watts: number;
  isOverLimit: boolean;
};

function calculateCell(resistance: number, voltage: number, cdr: number): TableCell {
  const amps = voltage / resistance;
  const watts = (voltage * voltage) / resistance;

  return {
    amps,
    watts,
    isOverLimit: amps > cdr,
  };
}

function formatNumber(value: number, fractionDigits = 1) {
  return value.toFixed(fractionDigits);
}

export default function App() {
  const [cdr, setCdr] = useState(25);

  const table = useMemo(
    () =>
      resistanceValues.map((resistance) => ({
        resistance,
        cells: voltageValues.map((voltage) => calculateCell(resistance, voltage, cdr)),
      })),
    [cdr],
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-700">Mechanical Mod Table</p>
              <h1 className="mt-1 text-3xl font-bold tracking-normal text-slate-950">
                Vape Tools
              </h1>
            </div>
            <label className="flex w-full max-w-xs flex-col gap-2 text-sm font-medium text-slate-700">
              Battery CDR
              <select
                value={cdr}
                onChange={(event) => setCdr(Number(event.target.value))}
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 shadow-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
              >
                {cdrOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}A
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            オームの法則で電流と出力を表示します。実運用ではバッテリーの連続放電定格、実測抵抗値、電圧降下、セル状態を別途確認してください。
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-left">
                <th className="w-28 px-4 py-3 font-semibold text-slate-700">抵抗値</th>
                {voltageValues.map((voltage) => (
                  <th key={voltage} className="px-4 py-3 font-semibold text-slate-700">
                    {formatNumber(voltage)}V
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.map((row) => (
                <tr key={row.resistance} className="border-b border-slate-100 last:border-0">
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">
                    {row.resistance.toFixed(2)}Ω
                  </th>
                  {row.cells.map((cell, index) => (
                    <td
                      key={voltageValues[index]}
                      className={`px-4 py-3 ${
                        cell.isOverLimit
                          ? "bg-rose-50 text-rose-800"
                          : "bg-white text-slate-700"
                      }`}
                    >
                      <div className="font-semibold">{formatNumber(cell.amps)}A</div>
                      <div className="text-xs">{formatNumber(cell.watts)}W</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 md:hidden">
          {table.map((row) => (
            <article
              key={row.resistance}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h2 className="text-lg font-bold text-slate-950">{row.resistance.toFixed(2)}Ω</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {row.cells.map((cell, index) => (
                  <div
                    key={voltageValues[index]}
                    className={`rounded-md border p-3 ${
                      cell.isOverLimit
                        ? "border-rose-200 bg-rose-50 text-rose-800"
                        : "border-slate-200 bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="text-xs font-semibold">{formatNumber(voltageValues[index])}V</div>
                    <div className="mt-1 text-base font-bold">{formatNumber(cell.amps)}A</div>
                    <div className="text-xs">{formatNumber(cell.watts)}W</div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
