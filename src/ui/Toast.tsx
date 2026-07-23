export function Toast(props: { text: string }) {
  return (
    <div className="toast" role="status">
      <span className="t-tag">Achievement — </span>
      {props.text}
    </div>
  );
}
