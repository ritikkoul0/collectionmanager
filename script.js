// API Base URL - use relative path for Vercel compatibility
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

// Data structure
let collections = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadCollections();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('newCollectionBtn').addEventListener('click', () => openCollectionModal());
    
    // Close modals on outside click
    document.getElementById('collectionModal').addEventListener('click', (e) => {
        if (e.target.id === 'collectionModal') {
            closeCollectionModal();
        }
    });
    
    document.getElementById('itemModal').addEventListener('click', (e) => {
        if (e.target.id === 'itemModal') {
            closeItemModal();
        }
    });
}

// API functions
async function loadCollections() {
    try {
        const response = await fetch(`${API_URL}/collections`);
        if (!response.ok) {
            throw new Error('Failed to fetch collections');
        }
        collections = await response.json();
        console.log('Loaded collections:', collections);
        // Log first item of first collection to check discountedPrice field
        if (collections.length > 0 && collections[0].items.length > 0) {
            console.log('First item sample:', collections[0].items[0]);
        }
        renderCollections();
    } catch (error) {
        console.error('Error loading collections:', error);
        // Fallback to localStorage if API fails
        const stored = localStorage.getItem('collections');
        if (stored) {
            collections = JSON.parse(stored);
            renderCollections();
        }
    }
}

// Collection Modal functions
function openCollectionModal(collectionId = null) {
    const modal = document.getElementById('collectionModal');
    const title = document.getElementById('modalTitle');
    const idInput = document.getElementById('collectionId');
    const nameInput = document.getElementById('collectionName');
    const descInput = document.getElementById('collectionDescription');
    
    if (collectionId) {
        const collection = collections.find(c => c.id === collectionId);
        if (collection) {
            title.textContent = 'Edit Collection';
            idInput.value = collectionId;
            nameInput.value = collection.name;
            descInput.value = collection.description || '';
        } else {
            console.error('Collection not found:', collectionId);
            return;
        }
    } else {
        title.textContent = 'Create New Collection';
        idInput.value = '';
        nameInput.value = '';
        descInput.value = '';
    }
    
    modal.classList.add('show');
    nameInput.focus();
}

function closeCollectionModal() {
    document.getElementById('collectionModal').classList.remove('show');
}

async function saveCollection() {
    const idInput = document.getElementById('collectionId');
    const nameInput = document.getElementById('collectionName');
    const descInput = document.getElementById('collectionDescription');
    
    const name = nameInput.value.trim();
    if (!name) {
        alert('Please enter a collection name');
        return;
    }
    
    const collectionId = idInput.value;
    const collectionData = {
        name: name,
        description: descInput.value.trim()
    };
    
    try {
        let response;
        if (collectionId) {
            // Update existing collection
            response = await fetch(`${API_URL}/collections/${collectionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(collectionData)
            });
        } else {
            // Create new collection
            response = await fetch(`${API_URL}/collections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(collectionData)
            });
        }
        
        if (!response.ok) {
            throw new Error('Failed to save collection');
        }
        
        await loadCollections();
        closeCollectionModal();
    } catch (error) {
        console.error('Error saving collection:', error);
        alert('Failed to save collection. Please try again.');
    }
}

async function deleteCollection(collectionId) {
    if (confirm('Are you sure you want to delete this collection? This will also delete all items in it.')) {
        try {
            const response = await fetch(`${API_URL}/collections/${collectionId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete collection');
            }
            
            await loadCollections();
        } catch (error) {
            console.error('Error deleting collection:', error);
            alert('Failed to delete collection. Please try again.');
        }
    }
}

// Item Modal functions
function openItemModal(collectionId, itemId = null) {
    const modal = document.getElementById('itemModal');
    const title = document.getElementById('itemModalTitle');
    const collectionIdInput = document.getElementById('itemCollectionId');
    const itemIdInput = document.getElementById('itemId');
    
    collectionIdInput.value = collectionId;
    
    if (itemId) {
        const collection = collections.find(c => c.id === collectionId);
        if (!collection) {
            console.error('Collection not found:', collectionId);
            return;
        }
        const item = collection.items.find(i => i.id === itemId);
        if (!item) {
            console.error('Item not found:', itemId);
            return;
        }
        
        title.textContent = 'Edit Item';
        itemIdInput.value = itemId;
        document.getElementById('itemTitle').value = item.title;
        document.getElementById('itemImage').value = item.image || '';
        document.getElementById('itemDescription').value = item.description || '';
        document.getElementById('itemLink').value = item.link;
        document.getElementById('itemPrice').value = item.price || '';
        document.getElementById('itemDiscountedPrice').value = item.discountedPrice || '';
        document.getElementById('itemDiscountDescription').value = item.discountDescription || '';
    } else {
        title.textContent = 'Add New Item';
        itemIdInput.value = '';
        document.getElementById('itemTitle').value = '';
        document.getElementById('itemImage').value = '';
        document.getElementById('itemDescription').value = '';
        document.getElementById('itemLink').value = '';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemDiscountedPrice').value = '';
        document.getElementById('itemDiscountDescription').value = '';
    }
    
    modal.classList.add('show');
    document.getElementById('itemTitle').focus();
}

function closeItemModal() {
    document.getElementById('itemModal').classList.remove('show');
}

async function saveItem() {
    const collectionId = document.getElementById('itemCollectionId').value;
    const itemId = document.getElementById('itemId').value;
    const title = document.getElementById('itemTitle').value.trim();
    const image = document.getElementById('itemImage').value.trim();
    const description = document.getElementById('itemDescription').value.trim();
    const link = document.getElementById('itemLink').value.trim();
    const price = document.getElementById('itemPrice').value.trim();
    const discountedPrice = document.getElementById('itemDiscountedPrice').value.trim();
    const discountDescription = document.getElementById('itemDiscountDescription').value.trim();
    
    if (!title) {
        alert('Please enter an item title');
        return;
    }
    
    if (!link) {
        alert('Please enter a product link');
        return;
    }
    
    if (!price) {
        alert('Please enter a price');
        return;
    }
    
    const itemData = {
        title: title,
        image: image,
        description: description,
        link: link,
        price: price,
        discountedPrice: discountedPrice,
        discountDescription: discountDescription,
        bought: false
    };
    
    try {
        let response;
        if (itemId) {
            // Update existing item
            response = await fetch(`${API_URL}/items/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(itemData)
            });
        } else {
            // Create new item
            response = await fetch(`${API_URL}/collections/${collectionId}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(itemData)
            });
        }
        
        if (!response.ok) {
            throw new Error('Failed to save item');
        }
        
        await loadCollections();
        closeItemModal();
    } catch (error) {
        console.error('Error saving item:', error);
        alert('Failed to save item. Please try again.');
    }
}

async function deleteItem(collectionId, itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        try {
            const response = await fetch(`${API_URL}/items/${itemId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete item');
            }
            
            await loadCollections();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item. Please try again.');
        }
    }
}

// Toggle bought status
async function toggleBought(itemId, currentStatus) {
    try {
        // Convert string to boolean if needed
        const isBought = currentStatus === true || currentStatus === 'true';
        
        const response = await fetch(`${API_URL}/items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bought: !isBought })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update item status');
        }
        
        await loadCollections();
    } catch (error) {
        console.error('Error updating item status:', error);
        alert('Failed to update item status. Please try again.');
    }
}

// Calculate total price for a collection
function calculateTotalPrice(collection) {
    if (!collection.items || collection.items.length === 0) {
        return { original: '₹0.00', discounted: '₹0.00' };
    }
    
    let originalTotal = 0;
    let discountedTotal = 0;
    
    collection.items.forEach(item => {
        if (item.price) {
            // Extract numeric value from price string or number
            let numericPrice;
            if (typeof item.price === 'number') {
                numericPrice = item.price;
            } else {
                const priceMatch = item.price.match(/[\d,]+\.?\d*/);
                if (priceMatch) {
                    numericPrice = parseFloat(priceMatch[0].replace(/,/g, ''));
                }
            }
            
            if (numericPrice && !isNaN(numericPrice)) {
                originalTotal += numericPrice;
                
                // Check if item has discounted price, if null use original price
                if (item.discountedPrice != null) {
                    let numericDiscount;
                    if (typeof item.discountedPrice === 'number') {
                        numericDiscount = item.discountedPrice;
                    } else if (typeof item.discountedPrice === 'string' && item.discountedPrice.trim() !== '') {
                        const discountMatch = item.discountedPrice.match(/[\d,]+\.?\d*/);
                        if (discountMatch) {
                            numericDiscount = parseFloat(discountMatch[0].replace(/,/g, ''));
                        }
                    }
                    
                    if (numericDiscount && !isNaN(numericDiscount) && numericDiscount > 0) {
                        discountedTotal += numericDiscount;
                    } else {
                        discountedTotal += numericPrice;
                    }
                } else {
                    // If no discounted price, use original price
                    discountedTotal += numericPrice;
                }
            }
        }
    });
    
    return {
        original: `₹${originalTotal.toFixed(2)}`,
        discounted: `₹${discountedTotal.toFixed(2)}`
    };
}

// Render functions
function renderCollections() {
    const container = document.getElementById('collectionsContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (collections.length === 0) {
        container.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }
    
    emptyState.classList.remove('show');
    
    container.innerHTML = collections.map(collection => {
        const totals = calculateTotalPrice(collection);
        console.log(`Rendering ${collection.name}: Original=${totals.original}, Discounted=${totals.discounted}, Different=${totals.original !== totals.discounted}`);
        return `
        <div class="collection">
            <div class="collection-header">
                <div class="collection-info">
                    <div class="collection-title-row">
                        <h2>${escapeHtml(collection.name)}</h2>
                        <div class="collection-total-container">
                            <span class="collection-total">${totals.original}</span>
                            ${totals.original !== totals.discounted ? `
                                <span class="collection-total-discounted">${totals.discounted}</span>
                            ` : ''}
                        </div>
                    </div>
                    ${collection.description ? `<p>${escapeHtml(collection.description)}</p>` : ''}
                </div>
                <div class="collection-actions">
                    <button class="icon-btn" onclick="openItemModal('${collection.id}')" title="Add Item">
                        ➕ Add Item
                    </button>
                    <button class="icon-btn" onclick="openCollectionModal('${collection.id}')" title="Edit Collection">
                        ✏️
                    </button>
                    <button class="icon-btn" onclick="deleteCollection('${collection.id}')" title="Delete Collection">
                        🗑️
                    </button>
                </div>
            </div>
            ${renderItems(collection)}
        </div>
        `;
    }).join('');
}

function renderItems(collection) {
    if (collection.items.length === 0) {
        return `
            <div class="empty-collection">
                <div class="empty-collection-icon">🎁</div>
                <p>No items yet. Click "Add Item" to start adding products!</p>
            </div>
        `;
    }
    
    return `
        <div class="items-grid">
            ${collection.items.map(item => `
                <div class="item-card ${item.bought ? 'bought' : ''}">
                    <div class="item-actions">
                        <button class="item-action-btn" onclick="openItemModal('${collection.id}', '${item.id}')" title="Edit">
                            ✏️
                        </button>
                        <button class="item-action-btn" onclick="deleteItem('${collection.id}', '${item.id}')" title="Delete">
                            🗑️
                        </button>
                    </div>
                    ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" class="item-image">` : ''}
                    <div class="item-content">
                        <h3 class="item-title">${escapeHtml(item.title)}</h3>
                        ${item.description ? `<p class="item-description">${escapeHtml(item.description)}</p>` : ''}
                        ${item.discountDescription ? `
                            <div class="item-discount-info">
                                <span class="discount-icon">💳</span>
                                <span class="discount-text">${escapeHtml(item.discountDescription)}</span>
                            </div>
                        ` : ''}
                        <div class="item-footer">
                            <div class="item-price-container">
                                ${item.discountedPrice ? `
                                    <span class="item-price-original">${escapeHtml(item.price)}</span>
                                    <span class="item-price-discounted">${escapeHtml(item.discountedPrice)}</span>
                                ` : `
                                    <span class="item-price">${escapeHtml(item.price)}</span>
                                `}
                            </div>
                            <a href="${escapeHtml(item.link)}"
                               target="_blank"
                               rel="noopener noreferrer"
                               class="item-link">
                                View Product →
                            </a>
                        </div>
                        <div class="item-checkbox">
                            <label class="checkbox-container">
                                <input type="checkbox"
                                       ${item.bought ? 'checked' : ''}
                                       onchange="toggleBought('${item.id}', ${item.bought})">
                                <span class="checkmark"></span>
                                <span class="checkbox-label">${item.bought ? 'Bought' : 'Mark as bought'}</span>
                            </label>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key closes modals
    if (e.key === 'Escape') {
        closeCollectionModal();
        closeItemModal();
    }
    
    // Ctrl/Cmd + N opens new collection modal
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openCollectionModal();
    }
});


