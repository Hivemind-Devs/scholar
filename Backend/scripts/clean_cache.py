#!/usr/bin/env python3
"""
Python Cache Temizleyici
Bu script __pycache__ klasörlerini, .pyc/.pyo dosyalarını ve diğer cache dosyalarını temizler.
"""

import os
import shutil
import sys
from pathlib import Path


def get_cache_patterns():
    """Temizlenecek cache pattern'lerini döndürür."""
    return [
        '__pycache__',
        '*.pyc',
        '*.pyo',
        '*.pyd',
        '.pytest_cache',
        '.mypy_cache',
        '.ruff_cache',
        '*.egg-info',
        '.coverage',
        'htmlcov',
        '.tox',
        'dist',
        'build',
    ]


def clean_cache(root_dir=None, verbose=True, dry_run=False):
    """
    Cache dosyalarını ve klasörlerini temizler.
    
    Args:
        root_dir: Temizleme yapılacak root dizin (varsayılan: script'in bulunduğu dizinin bir üstü)
        verbose: Detaylı çıktı göster
        dry_run: Sadece ne silineceğini göster, silme
    """
    if root_dir is None:

        root_dir = Path(__file__).parent.parent
    
    root_path = Path(root_dir).resolve()
    
    if not root_path.exists():
        print(f"Hata: Dizin bulunamadı: {root_path}")
        return False
    
    if verbose:
        print(f"Cache temizleme başlatılıyor: {root_path}")
        print(f"Mod: {'DRY RUN (silme yok)' if dry_run else 'SİLME'}")
        print("-" * 60)
    
    removed_count = 0
    removed_size = 0
    
    patterns = get_cache_patterns()
    

    for pycache_dir in root_path.rglob('__pycache__'):
        if pycache_dir.is_dir():
            try:

                size = sum(f.stat().st_size for f in pycache_dir.rglob('*') if f.is_file())
                
                if verbose:
                    rel_path = pycache_dir.relative_to(root_path)
                    print(f"Bulundu: {rel_path}/ ({size:,} bytes)")
                
                if not dry_run:
                    shutil.rmtree(pycache_dir)
                    if verbose:
                        print(f"  ✓ Silindi")
                
                removed_count += 1
                removed_size += size
            except Exception as e:
                print(f"Hata: {pycache_dir} silinirken hata oluştu: {e}")
    

    for pattern in ['*.pyc', '*.pyo', '*.pyd']:
        for file_path in root_path.rglob(pattern):
            if file_path.is_file():
                try:
                    size = file_path.stat().st_size
                    
                    if verbose:
                        rel_path = file_path.relative_to(root_path)
                        print(f"Bulundu: {rel_path} ({size:,} bytes)")
                    
                    if not dry_run:
                        file_path.unlink()
                        if verbose:
                            print(f"  ✓ Silindi")
                    
                    removed_count += 1
                    removed_size += size
                except Exception as e:
                    print(f"Hata: {file_path} silinirken hata oluştu: {e}")
    

    cache_dirs = ['.pytest_cache', '.mypy_cache', '.ruff_cache', 'htmlcov', '.tox']
    for cache_dir_name in cache_dirs:
        for cache_dir in root_path.rglob(cache_dir_name):
            if cache_dir.is_dir():
                try:
                    size = sum(f.stat().st_size for f in cache_dir.rglob('*') if f.is_file())
                    
                    if verbose:
                        rel_path = cache_dir.relative_to(root_path)
                        print(f"Bulundu: {rel_path}/ ({size:,} bytes)")
                    
                    if not dry_run:
                        shutil.rmtree(cache_dir)
                        if verbose:
                            print(f"  ✓ Silindi")
                    
                    removed_count += 1
                    removed_size += size
                except Exception as e:
                    print(f"Hata: {cache_dir} silinirken hata oluştu: {e}")
    

    for egg_info in root_path.rglob('*.egg-info'):
        if egg_info.is_dir():
            try:
                size = sum(f.stat().st_size for f in egg_info.rglob('*') if f.is_file())
                
                if verbose:
                    rel_path = egg_info.relative_to(root_path)
                    print(f"Bulundu: {rel_path}/ ({size:,} bytes)")
                
                if not dry_run:
                    shutil.rmtree(egg_info)
                    if verbose:
                        print(f"  ✓ Silindi")
                
                removed_count += 1
                removed_size += size
            except Exception as e:
                print(f"Hata: {egg_info} silinirken hata oluştu: {e}")
    

    for build_dir_name in ['dist', 'build']:
        build_dir = root_path / build_dir_name
        if build_dir.exists() and build_dir.is_dir():
            try:
                size = sum(f.stat().st_size for f in build_dir.rglob('*') if f.is_file())
                
                if verbose:
                    print(f"Bulundu: {build_dir_name}/ ({size:,} bytes)")
                
                if not dry_run:
                    shutil.rmtree(build_dir)
                    if verbose:
                        print(f"  ✓ Silindi")
                
                removed_count += 1
                removed_size += size
            except Exception as e:
                print(f"Hata: {build_dir} silinirken hata oluştu: {e}")
    

    print("-" * 60)
    if dry_run:
        print(f"DRY RUN Tamamlandı:")
        print(f"  {removed_count} cache öğesi bulundu")
        print(f"  Toplam boyut: {removed_size:,} bytes ({removed_size / 1024:.2f} KB)")
        print(f"\nGerçekten silmek için --force parametresini kullanın.")
    else:
        print(f"Temizleme tamamlandı!")
        print(f"  {removed_count} cache öğesi silindi")
        print(f"  Toplam kazanılan alan: {removed_size:,} bytes ({removed_size / 1024:.2f} KB)")
    
    return True


def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Python cache dosyalarını ve klasörlerini temizler',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Örnekler:
  # Dry run (sadece ne silineceğini göster)
  python clean_cache.py
  
  # Gerçekten sil
  python clean_cache.py --force
  
  # Belirli bir dizini temizle
  python clean_cache.py --dir /path/to/dir --force
  
  # Sessiz mod
  python clean_cache.py --force --quiet
        """
    )
    
    parser.add_argument(
        '--dir', '-d',
        type=str,
        default=None,
        help='Temizlenecek root dizin (varsayılan: script\'in bir üst dizini)'
    )
    
    parser.add_argument(
        '--force', '-f',
        action='store_true',
        help='Gerçekten sil (varsayılan: dry run)'
    )
    
    parser.add_argument(
        '--quiet', '-q',
        action='store_true',
        help='Sessiz mod (sadece özet göster)'
    )
    
    args = parser.parse_args()
    
    dry_run = not args.force
    verbose = not args.quiet
    
    if not dry_run:

        if verbose:
            response = input("Cache dosyalarını silmek istediğinize emin misiniz? (yes/no): ")
            if response.lower() not in ['yes', 'y', 'evet', 'e']:
                print("İptal edildi.")
                return 1
    
    success = clean_cache(
        root_dir=args.dir,
        verbose=verbose,
        dry_run=dry_run
    )
    
    return 0 if success else 1


if __name__ == '__main__':
    sys.exit(main())

