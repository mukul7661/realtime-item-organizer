interface Item {
  id: string;
  title: string;
  icon: string;
  parentId: string | null;
  order: number;
}

interface Folder {
  id: string;
  name: string;
  isOpen: boolean;
  parentId: string | null;
  order: number;
}
