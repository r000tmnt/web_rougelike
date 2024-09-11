import { Sortable, Swap } from 'sortablejs/modular/sortable.core.esm';

const customSortable = Sortable;
customSortable.mount(new Swap());

export default customSortable;
