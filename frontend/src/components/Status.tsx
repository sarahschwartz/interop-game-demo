import Spinner from "./Spinner";

export function Status({
  text,
  isLoading,
}: {
  text: string;
  isLoading?: boolean;
}) {
  const color = "#87EDD0";

  return (
    <div
      style={{
        height: "28px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <div style={{ display: "flex" }}>
        {isLoading ? (
          <div style={{ transform: "scale(0.6" }}>
            <Spinner />
          </div>
        ) : (
          <svg width="10" height="10">
            <circle cx="5" cy="5" r="5" fill={color} strokeWidth="4" />
          </svg>
        )}
      </div>
      <p>{text}</p>
    </div>
  );
}
