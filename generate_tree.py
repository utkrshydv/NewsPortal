import os

def generate_tree(dir_path, prefix="", ignore_dirs=None):
    if ignore_dirs is None:
        ignore_dirs = {'.git', 'node_modules', 'venv', 'env', '__pycache__', 'build', 'dist', '.vscode', '.idea'}
        
    output = []
    try:
        items = os.listdir(dir_path)
    except PermissionError:
        return []
        
    items = sorted(items)
    # Filter out hidden files and ignored dirs
    items = [item for item in items if not (item.startswith('.') and item not in ['.env', '.gitignore']) and item not in ignore_dirs]
    
    for i, item in enumerate(items):
        path = os.path.join(dir_path, item)
        is_last = (i == len(items) - 1)
        
        connector = "└── " if is_last else "├── "
        output.append(f"{prefix}{connector}{item}")
        
        if os.path.isdir(path):
            extension_prefix = "    " if is_last else "│   "
            output.extend(generate_tree(path, prefix=prefix + extension_prefix, ignore_dirs=ignore_dirs))
            
    return output

if __name__ == "__main__":
    base_dir = r"c:\Users\KIIT0001\Desktop\6thSem\miniProject3"
    tree = generate_tree(base_dir)
    with open(r"c:\Users\KIIT0001\Desktop\6thSem\miniProject3\project_structure.txt", "w", encoding='utf-8') as f:
        f.write(f"miniProject3/\n")
        f.write("\n".join(tree))
