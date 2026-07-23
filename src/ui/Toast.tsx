interface Props { title: string; body: string; }
export function Toast({ title, body }: Props): JSX.Element {
  return (
    <div className="toast" role="status">
      <div className="tt">{title}</div>
      <div className="tb">{body}</div>
    </div>
  );
}
