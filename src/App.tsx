import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const resistanceValues = [
  0.08, 0.09, 0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.18, 0.2, 0.22, 0.25,
  0.28, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.7, 0.8, 0.9, 1,
];

const voltageValues = [4.2, 3.9, 3.7, 3.5, 3.2];
const cdrOptions = [15, 20, 25, 30, 35, 40];
const wireMaterials = [
  { value: "kanthal-a1", label: "Kanthal A1", resistivity: 1.45e-6 },
  { value: "nichrome-80", label: "Nichrome 80", resistivity: 1.09e-6 },
  { value: "ss316l", label: "SS316L", resistivity: 7.4e-7 },
] as const;
const coilBuildTypes = [
  { value: "round", label: "Round" },
  { value: "parallel", label: "Parallel" },
  { value: "twisted", label: "Twisted" },
] as const;
const awgOptions = Array.from({ length: 13 }, (_, index) => {
  const value = 20 + index;
  const diameterMm = 0.127 * 92 ** ((36 - value) / 39);

  return {
    value,
    diameterMm,
  };
});
const themeOptions = [
  { value: "system", label: "システム", icon: Monitor },
  { value: "light", label: "ライト", icon: Sun },
  { value: "dark", label: "ダーク", icon: Moon },
] as const;

type ThemeMode = (typeof themeOptions)[number]["value"];
type WireMaterial = (typeof wireMaterials)[number]["value"];
type CoilBuildType = (typeof coilBuildTypes)[number]["value"];

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

function calculateCoilResistance({
  material,
  buildType,
  awg,
  strandCount,
  twistLengthFactor,
  innerDiameterMm,
  wraps,
  legLengthMm,
  coilCount,
}: {
  material: WireMaterial;
  buildType: CoilBuildType;
  awg: number;
  strandCount: number;
  twistLengthFactor: number;
  innerDiameterMm: number;
  wraps: number;
  legLengthMm: number;
  coilCount: number;
}) {
  const selectedMaterial = wireMaterials.find((option) => option.value === material)!;
  const selectedAwg = awgOptions.find((option) => option.value === awg)!;
  const effectiveStrandCount = buildType === "round" ? 1 : strandCount;
  const lengthFactor = buildType === "twisted" ? twistLengthFactor : 1;
  const wireDiameterM = selectedAwg.diameterMm / 1000;
  const crossSectionArea = Math.PI * (wireDiameterM / 2) ** 2;
  const wrapLengthMm = Math.PI * (innerDiameterMm + selectedAwg.diameterMm) * wraps;
  const totalLengthMm = (wrapLengthMm + legLengthMm * 2) * lengthFactor;
  const totalLengthM = totalLengthMm / 1000;
  const singleStrandResistance = (selectedMaterial.resistivity * totalLengthM) / crossSectionArea;
  const singleCoilResistance = singleStrandResistance / effectiveStrandCount;

  return {
    singleCoilResistance,
    buildResistance: singleCoilResistance / coilCount,
    totalLengthMm,
  };
}

export default function App() {
  const [cdr, setCdr] = useState(25);
  const [coilMaterial, setCoilMaterial] = useState<WireMaterial>("kanthal-a1");
  const [coilBuildType, setCoilBuildType] = useState<CoilBuildType>("round");
  const [coilAwg, setCoilAwg] = useState(26);
  const [strandCount, setStrandCount] = useState(2);
  const [twistLengthFactor, setTwistLengthFactor] = useState(1.1);
  const [innerDiameterMm, setInnerDiameterMm] = useState(3);
  const [wraps, setWraps] = useState(6);
  const [legLengthMm, setLegLengthMm] = useState(5);
  const [coilCount, setCoilCount] = useState(1);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const storedMode = window.localStorage.getItem("vape-tools-theme");
    return themeOptions.some((option) => option.value === storedMode)
      ? (storedMode as ThemeMode)
      : "system";
  });

  const table = useMemo(
    () =>
      resistanceValues.map((resistance) => ({
        resistance,
        cells: voltageValues.map((voltage) => calculateCell(resistance, voltage, cdr)),
      })),
    [cdr],
  );
  const coilResult = useMemo(
    () =>
      calculateCoilResistance({
        material: coilMaterial,
        buildType: coilBuildType,
        awg: coilAwg,
        strandCount,
        twistLengthFactor,
        innerDiameterMm,
        wraps,
        legLengthMm,
        coilCount,
      }),
    [
      coilMaterial,
      coilBuildType,
      coilAwg,
      strandCount,
      twistLengthFactor,
      innerDiameterMm,
      wraps,
      legLengthMm,
      coilCount,
    ],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const shouldUseDark = themeMode === "dark" || (themeMode === "system" && mediaQuery.matches);
      document.documentElement.classList.toggle("dark", shouldUseDark);
      document.documentElement.style.colorScheme = shouldUseDark ? "dark" : "light";
    };

    window.localStorage.setItem("vape-tools-theme", themeMode);
    applyTheme();
    mediaQuery.addEventListener("change", applyTheme);

    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [themeMode]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                Mechanical Mod Table
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-normal text-slate-950 dark:text-white">
                Vape Tools
              </h1>
            </div>
            <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
              <div className="inline-flex h-11 w-fit rounded-md border border-slate-300 bg-slate-100 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = themeMode === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-label={`${option.label}モード`}
                      title={`${option.label}モード`}
                      aria-pressed={isActive}
                      onClick={() => setThemeMode(option.value)}
                      className={`flex h-9 w-10 items-center justify-center rounded text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                        isActive
                          ? "bg-white text-cyan-700 shadow-sm dark:bg-slate-800 dark:text-cyan-300"
                          : "text-slate-500 hover:bg-white/70 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white"
                      }`}
                    >
                      <Icon aria-hidden="true" size={18} strokeWidth={2.25} />
                    </button>
                  );
                })}
              </div>
              <label className="flex w-full max-w-xs flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                Battery CDR
                <select
                  value={cdr}
                  onChange={(event) => setCdr(Number(event.target.value))}
                  className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 shadow-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950"
                >
                  {cdrOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}A
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            オームの法則で電流と出力を表示します。実運用ではバッテリーの連続放電定格、実測抵抗値、電圧降下、セル状態を別途確認してください。
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              コイル抵抗値計算
            </h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              Round、Parallel、Twisted の概算です。実測値はポスト固定、足の長さ、線材差、熱処理で変わります。
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              ビルド
              <select
                value={coilBuildType}
                onChange={(event) => setCoilBuildType(event.target.value as CoilBuildType)}
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 shadow-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950"
              >
                {coilBuildTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              線材
              <select
                value={coilMaterial}
                onChange={(event) => setCoilMaterial(event.target.value as WireMaterial)}
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 shadow-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950"
              >
                {wireMaterials.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              ワイヤー
              <select
                value={coilAwg}
                onChange={(event) => setCoilAwg(Number(event.target.value))}
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 shadow-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950"
              >
                {awgOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} AWG ({option.diameterMm.toFixed(3)}mm)
                  </option>
                ))}
              </select>
            </label>

            {coilBuildType !== "round" && (
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                ワイヤー本数
                <input
                  type="number"
                  min="2"
                  max="8"
                  step="1"
                  value={strandCount}
                  onChange={(event) => setStrandCount(Number(event.target.value))}
                  className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 shadow-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950"
                />
              </label>
            )}

            {coilBuildType === "twisted" && (
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                ツイスト補正
                <input
                  type="number"
                  min="1"
                  max="1.5"
                  step="0.01"
                  value={twistLengthFactor}
                  onChange={(event) => setTwistLengthFactor(Number(event.target.value))}
                  className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 shadow-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950"
                />
              </label>
            )}

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              内径 mm
              <input
                type="number"
                min="1"
                max="6"
                step="0.1"
                value={innerDiameterMm}
                onChange={(event) => setInnerDiameterMm(Number(event.target.value))}
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 shadow-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              巻き数
              <input
                type="number"
                min="1"
                max="20"
                step="0.5"
                value={wraps}
                onChange={(event) => setWraps(Number(event.target.value))}
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 shadow-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              片足の長さ mm
              <input
                type="number"
                min="0"
                max="30"
                step="0.5"
                value={legLengthMm}
                onChange={(event) => setLegLengthMm(Number(event.target.value))}
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 shadow-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              コイル数
              <select
                value={coilCount}
                onChange={(event) => setCoilCount(Number(event.target.value))}
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 shadow-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950"
              >
                <option value={1}>Single</option>
                <option value={2}>Dual</option>
                <option value={3}>Triple</option>
                <option value={4}>Quad</option>
              </select>
            </label>
          </div>
        </div>

        <aside className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 shadow-sm dark:border-cyan-900 dark:bg-cyan-950/30 sm:p-5">
          <p className="text-sm font-semibold text-cyan-800 dark:text-cyan-200">推定抵抗値</p>
          <div className="mt-3 text-4xl font-bold tracking-normal text-slate-950 dark:text-white">
            {coilResult.buildResistance.toFixed(2)}Ω
          </div>
          <dl className="mt-5 grid gap-3 text-sm">
            <div>
              <dt className="text-slate-600 dark:text-slate-400">1コイルあたり</dt>
              <dd className="font-semibold text-slate-900 dark:text-slate-100">
                {coilResult.singleCoilResistance.toFixed(2)}Ω
              </dd>
            </div>
            <div>
              <dt className="text-slate-600 dark:text-slate-400">ワイヤー長</dt>
              <dd className="font-semibold text-slate-900 dark:text-slate-100">
                約 {coilResult.totalLengthMm.toFixed(1)}mm / 本
              </dd>
            </div>
            {coilBuildType !== "round" && (
              <div>
                <dt className="text-slate-600 dark:text-slate-400">ワイヤー構成</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100">
                  {strandCount}本
                  {coilBuildType === "twisted" ? ` / 補正 ${twistLengthFactor.toFixed(2)}x` : ""}
                </dd>
              </div>
            )}
          </dl>
        </aside>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:block">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-left dark:border-slate-800 dark:bg-slate-800">
                <th className="w-28 px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                  抵抗値
                </th>
                {voltageValues.map((voltage) => (
                  <th
                    key={voltage}
                    className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {formatNumber(voltage)}V
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.map((row) => (
                <tr
                  key={row.resistance}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                    {row.resistance.toFixed(2)}Ω
                  </th>
                  {row.cells.map((cell, index) => (
                    <td
                      key={voltageValues[index]}
                      className={`px-4 py-3 ${
                        cell.isOverLimit
                          ? "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                          : "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-300"
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
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                {row.resistance.toFixed(2)}Ω
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {row.cells.map((cell, index) => (
                  <div
                    key={voltageValues[index]}
                    className={`rounded-md border p-3 ${
                      cell.isOverLimit
                        ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
                        : "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    }`}
                  >
                    <div className="text-xs font-semibold">
                      {formatNumber(voltageValues[index])}V
                    </div>
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
