# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['../../../offline_static_server.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=['product_specs_lookup', 'version', 'mode_switch', 'python_runtime', 'ai_services'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='TECHSTORES-OFFLINE',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    version='c:/Users/DelMashiry/Documents/TECHSTORESys/scripts/version-info.txt',
    icon=['c:/Users/DelMashiry/Documents/TECHSTORESys/assets/techstores.ico'],
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='TECHSTORES-OFFLINE',
)
