export default function init(el) {
  const columns = el.querySelectorAll(":scope > div");
  columns.forEach((column, idx) => {
    column.classList.add("column", `column-${idx + 1}`);
  });
}
