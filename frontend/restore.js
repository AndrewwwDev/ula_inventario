const fs = require('fs');

let ts = fs.readFileSync('src/app/pages/dashboard/dashboard.component.ts', 'utf8');

if (!ts.includes('isDetallesBienModalOpen')) {
    ts = ts.replace('showDetailsModal = false;', 'showDetailsModal = false;\n  isDetallesBienModalOpen = false;\n  selectedBienDetails: any = null;');
}

if (!ts.includes('openDetallesBienModal')) {
    const methods = `
  openDetallesBienModal(bien: any) {
    this.selectedBienDetails = bien;
    this.isDetallesBienModalOpen = true;
  }

  closeDetallesBienModal() {
    this.isDetallesBienModalOpen = false;
    this.selectedBienDetails = null;
  }
`;
    ts = ts.replace('closeDetailsModal() {', methods + '\n  closeDetailsModal() {');
}

fs.writeFileSync('src/app/pages/dashboard/dashboard.component.ts', ts, 'utf8');
console.log('Restored TS changes');

let html = fs.readFileSync('src/app/pages/dashboard/dashboard.component.html', 'utf8');

// 1. Hide Configuracion / Usuarios
html = html.replace(
  /<a href="#" class="flex items-center text-gray-400 hover:text-white transition-colors group">[\s\S]*?<span class="material-icons-outlined text-gray-500 group-hover:text-white mr-3 transition-colors">settings<\/span>[\s\S]*?Configuración[\s\S]*?<\/a>/,
  '<!-- <a href="#" class="flex items-center text-gray-400 hover:text-white transition-colors group">...Configuración...</a> -->'
);
html = html.replace(
  /<a href="#" class="flex items-center text-gray-400 hover:text-white transition-colors group">[\s\S]*?<span class="material-icons-outlined text-gray-500 group-hover:text-white mr-3 transition-colors">people_alt<\/span>[\s\S]*?Usuarios[\s\S]*?<\/a>/,
  '<!-- <a href="#" class="flex items-center text-gray-400 hover:text-white transition-colors group">...Usuarios...</a> -->'
);
html = html.replace(
  /<div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Sistema<\/div>/,
  '<!-- <div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Sistema</div> -->'
);

// 2. Encargado dropdown
html = html.replace(
  /<option \*ngFor="let enc of encargados" \[ngValue\]="enc\.id">{{ enc\.nombre }} {{ enc\.apellido }}<\/option>/g,
  '<option *ngFor="let enc of encargados" [ngValue]="enc.id">{{ enc.cedula }} - {{ enc.nombre }} {{ enc.apellido }}</option>'
);

// 3. Documentos relacionados
html = html.replace(/<div class="mt-8 border-t border-gray-200 pt-6">[\s\S]*?<!-- Modal Footer -->/g, '<!-- Modal Footer -->');

// 4. Make rows clickable to open details
html = html.replace(/<tr \*ngFor="let item of displayedInventory" class="hover:bg-gray-50 transition-colors border-b border-gray-100">/, 
  '<tr *ngFor="let item of displayedInventory" class="hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-pointer" (click)="openDetallesBienModal(item)">');

// 5. Add details modal at the end, before the last closing tags
const detailsModal = `
  <!-- Modal Detalles de Bien -->
  <div *ngIf="isDetallesBienModalOpen" class="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h2 class="text-lg font-bold text-gray-800">Detalles del Bien</h2>
        <button (click)="closeDetallesBienModal()" class="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto space-y-6">
        <div>
          <p class="text-lg font-bold text-gray-800">{{ selectedBienDetails?.nombre }} <span class="text-sm font-normal text-gray-500 ml-2">(ID: {{ selectedBienDetails?.codigo }})</span></p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <h3 class="text-sm font-bold text-gray-500 mb-1">Estado Operativo</h3>
            <p class="text-sm font-medium text-gray-800">{{ selectedBienDetails?.estado_operativo }}</p>
          </div>
          <div>
            <h3 class="text-sm font-bold text-gray-500 mb-1">Condición Física</h3>
            <p class="text-sm font-medium text-gray-800">{{ selectedBienDetails?.condicion_fisica }}</p>
          </div>
          <div>
            <h3 class="text-sm font-bold text-gray-500 mb-1">Categoría</h3>
            <p class="text-sm font-medium text-gray-800">{{ selectedBienDetails?.categoria?.nombre || 'N/A' }}</p>
          </div>
          <div>
            <h3 class="text-sm font-bold text-gray-500 mb-1">Ubicación</h3>
            <p class="text-sm font-medium text-gray-800">{{ selectedBienDetails?.ubicacion?.nombre || 'N/A' }}</p>
          </div>
          <div class="col-span-2">
            <h3 class="text-sm font-bold text-gray-500 mb-1">Encargado</h3>
            <p class="text-sm font-medium text-gray-800">{{ selectedBienDetails?.encargado?.nombre || 'N/A' }} ({{ selectedBienDetails?.encargado?.cedula || 'N/A' }})</p>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-bold text-gray-500 mb-1">Descripción</h3>
          <p class="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{{ selectedBienDetails?.descripcion }}</p>
        </div>

        <div *ngIf="selectedBienDetails?.imagen_url">
          <h3 class="text-sm font-bold text-gray-500 mb-2">Fotografía</h3>
          <div class="w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center min-h-[200px]">
            <img [src]="selectedBienDetails.imagen_url" alt="Fotografía" class="max-w-full h-auto object-contain">
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
        <button (click)="closeDetallesBienModal()" class="px-5 py-2.5 bg-gray-800 text-white font-bold hover:bg-gray-900 rounded-xl transition-colors text-sm">
          Cerrar
        </button>
      </div>
    </div>
  </div>
`;

if (!html.includes('Modal Detalles de Bien')) {
  // Try to insert it before the last </div>
  const match = html.match(/<\/div>\s*<\/div>\s*<\/div>\s*$/);
  if(match) {
    html = html.replace(/<\/div>\s*<\/div>\s*<\/div>\s*$/, detailsModal + '\n</div>\n</div>\n</div>\n');
  } else {
    html += detailsModal;
  }
}

fs.writeFileSync('src/app/pages/dashboard/dashboard.component.html', html, 'utf8');
console.log('Restored HTML changes');
