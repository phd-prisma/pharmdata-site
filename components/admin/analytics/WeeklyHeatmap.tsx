import { formatNumber } from "./format";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
// Começa na segunda, como a semana de trabalho
const ORDER = [1, 2, 3, 4, 5, 6, 0];

// Escala de uma cor só (validada: tons em ordem e contraste ≥ 2:1 no branco);
// zero fica no fundo neutro
const STEPS = ["var(--a-soft)", "#8cc0bb", "#5ea39f", "#348684", "#1a6566", "#0b3b3e"];

function step(value: number, max: number) {
  if (!value) return 0;
  return Math.max(1, Math.ceil((value / max) * (STEPS.length - 1)));
}

// Visitantes por dia da semana × hora (horário de Brasília)
export function WeeklyHeatmap({ weekly }: { weekly: number[][] }) {
  const max = Math.max(1, ...weekly.flat());
  const total = weekly.flat().reduce((sum, value) => sum + value, 0);

  let peak = { day: 0, hour: 0, value: 0 };
  weekly.forEach((hours, day) =>
    hours.forEach((value, hour) => {
      if (value > peak.value) peak = { day, hour, value };
    }),
  );

  return (
    <div>
      {total > 0 && (
        <p className="mb-4 text-sm text-(--a-body)">
          Pico: <strong className="font-semibold">{DAY_NAMES[peak.day]}, {peak.hour}h</strong>
        </p>
      )}
      <div className="overflow-x-auto">
        <div className="grid min-w-[560px] grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-[2px] text-[11px] text-(--a-muted)">
          {ORDER.map((day) => (
            <div key={day} className="contents">
              <span className="self-center">{DAYS[day]}</span>
              {weekly[day]?.map((value, hour) => (
                <span
                  key={hour}
                  title={`${DAY_NAMES[day]}, ${hour}h: ${formatNumber(value)} ${value === 1 ? "visitante" : "visitantes"}`}
                  className="aspect-square rounded-[3px]"
                  style={{ background: STEPS[step(value, max)] }}
                />
              ))}
            </div>
          ))}
          <span />
          {Array.from({ length: 24 }, (_, hour) => (
            <span key={hour} className="text-center">{hour % 3 === 0 ? `${hour}h` : ""}</span>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-(--a-muted)">
        menos
        {STEPS.map((color) => <span key={color} className="size-3 rounded-[3px]" style={{ background: color }} />)}
        mais
      </div>
    </div>
  );
}
