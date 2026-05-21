const fs = require('fs');
let html = fs.readFileSync('src/app/pages/dashboard/dashboard.component.html', 'utf8');

// 1. Remove Documentos relacionados
html = html.replace(/<div class="mt-8 border-t border-gray-200 pt-6">[\s\S]*?<!-- Modal Footer -->/g, '<!-- Modal Footer -->');

// 2. Add scanner class to button
html = html.replace(/<button class="w-12 h-12 bg-teal-400 text-white rounded-full flex items-center justify-center hover:bg-teal-500 shadow-md transition-colors">/, 
  '<button (click)="simulateScanner()" [disabled]="scannerActive" class="w-12 h-12 bg-teal-400 text-white rounded-full flex items-center justify-center hover:bg-teal-500 shadow-md transition-colors disabled:opacity-75 disabled:cursor-wait">');
html = html.replace(/<span class="material-icons-outlined">qr_code_scanner<\/span>/, 
  '<span class="material-icons-outlined" [class.animate-pulse]="scannerActive" [class.text-teal-100]="scannerActive">qr_code_scanner</span>');

// 3. Improve Image upload block
const oldImageBlock = `<!-- Image Upload -->
            <div class="space-y-4">
              <label class="text-sm font-bold text-gray-700">Imagen del bien</label>
              <div *ngIf="newBien.imagen_url" class="mb-4">
                <p class="text-xs text-gray-500 mb-2">Imagen actual:</p>
                <img [src]="newBien.imagen_url" alt="Imagen actual" class="w-full h-32 object-cover rounded-lg border border-gray-200">
              </div>
              <div *ngIf="!newBien.imagen_url" class="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                <span class="material-icons-outlined text-primary text-3xl mb-2">image</span>
                <p class="text-sm font-medium text-primary">{{ newBien.imagen_url ? 'Cambiar imagen' : 'Subir imagen' }}: <span class="text-gray-500 font-normal">selecciona un archivo.</span></p>
                <p class="text-xs text-gray-400 mt-1">PNG o JPG < 5MB</p>
                <input type="file" (change)="onImageSelected($event)" accept="image/*" class="mt-2" />
              </div>
            </div>`;

const newImageBlock = `<!-- Image Upload -->
            <div class="space-y-4">
              <label class="text-sm font-bold text-gray-700">Imagen del bien</label>
              <div *ngIf="newBien.imagen_url && !selectedImageFile" class="mb-4 relative group rounded-xl overflow-hidden border border-gray-200">
                <img [src]="newBien.imagen_url" alt="Imagen actual" class="w-full h-32 object-cover bg-white">
                <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <p class="text-white text-sm font-bold flex items-center"><span class="material-icons-outlined mr-2">edit</span> Cambiar Imagen</p>
                </div>
                <input type="file" (change)="onImageSelected($event)" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
              
              <div *ngIf="!newBien.imagen_url || selectedImageFile" class="border-2 border-dashed border-blue-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer relative overflow-hidden group">
                <input type="file" (change)="onImageSelected($event)" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <span class="material-icons-outlined text-blue-500 text-4xl mb-3 group-hover:scale-110 transition-transform">cloud_upload</span>
                <p class="text-sm font-medium text-blue-600 mb-1">
                  <span class="font-bold underline decoration-blue-400 underline-offset-2">Haz clic para explorar</span> o arrastra un archivo aquí
                </p>
                <p class="text-xs text-blue-400 mb-4">Solo archivos PNG o JPG de hasta 5MB</p>
                <div *ngIf="selectedImageFile" class="px-4 py-2 bg-white border border-blue-200 rounded-lg shadow-sm text-sm font-medium text-blue-700 flex items-center max-w-[90%] truncate">
                   <span class="material-icons-outlined mr-2 text-[18px]">image</span>
                   <span class="truncate">{{ selectedImageFile?.name }}</span>
                </div>
              </div>
            </div>`;

html = html.replace(oldImageBlock, newImageBlock);

// 4. Improve QR Code block
const oldQrBlock = `<!-- QR Code Section -->
            <div class="flex items-center space-x-6 pt-2">
              <h3 class="text-2xl font-black text-gray-800">QR</h3>
              <div class="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">
                <!-- Placeholder for QR Image -->
                <span class="material-icons-outlined text-gray-400 text-4xl">qr_code_2</span>
              </div>
              <button class="flex items-center px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-colors shadow-sm">
                <span class="material-icons-outlined mr-2">print</span> Imprimir
              </button>
            </div>`;

const newQrBlock = `<!-- QR Code Section -->
            <div class="flex items-center space-x-6 pt-2">
              <h3 class="text-2xl font-black text-gray-800">QR</h3>
              <div class="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 overflow-hidden shadow-inner relative group">
                <img *ngIf="newBien.codigo" [src]="'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + newBien.codigo" alt="QR Code" class="w-full h-full object-cover bg-white">
                <span *ngIf="!newBien.codigo" class="material-icons-outlined text-gray-300 text-4xl">qr_code_2</span>
                <div *ngIf="newBien.codigo" class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span class="material-icons-outlined text-white">qr_code_scanner</span>
                </div>
              </div>
              <button class="flex items-center px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-md">
                <span class="material-icons-outlined mr-2">print</span> Imprimir QR
              </button>
            </div>`;

html = html.replace(oldQrBlock, newQrBlock);

// Update Encargado dropdown
const oldEncargadoBlock = `<option *ngFor="let enc of encargados" [ngValue]="enc.id">{{ enc.nombre }} {{ enc.apellido }}</option>`;
const newEncargadoBlock = `<option *ngFor="let enc of encargados" [ngValue]="enc.id">{{ enc.cedula }} - {{ enc.nombre }} {{ enc.apellido }}</option>`;
html = html.replace(oldEncargadoBlock, newEncargadoBlock);

// Remove duplicate Modal "Desincorporar" block from bottom:
let parts = html.split('<!-- Modal "Desincorporar" -->');
if (parts.length > 2) {
    html = parts[0] + '<!-- Modal "Desincorporar" -->' + parts[1];
}

// Remove duplicate "Detalles de Desincorporación"
let detailsParts = html.split('<!-- Modal "Detalles de Desincorporación" -->');
if (detailsParts.length > 2) {
    html = detailsParts[0] + '<!-- Modal "Detalles de Desincorporación" -->' + detailsParts[1];
}

fs.writeFileSync('src/app/pages/dashboard/dashboard.component.html', html, 'utf8');
console.log('Fixed dashboard.component.html');
