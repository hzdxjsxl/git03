def test_coordinate_transform():
    print("=== 坐标转换一致性测试 ===\n")
    
    test_cases = [
        {"viewX": 0, "viewY": 0, "scale": 1.0, "clientX": 500, "clientY": 500, "canvasLeft": 0, "canvasTop": 0},
        {"viewX": 1000, "viewY": 500, "scale": 1.0, "clientX": 300, "clientY": 200, "canvasLeft": 0, "canvasTop": 0},
        {"viewX": 0, "viewY": 0, "scale": 2.0, "clientX": 500, "clientY": 500, "canvasLeft": 0, "canvasTop": 0},
        {"viewX": 2000, "viewY": 2000, "scale": 0.5, "clientX": 400, "clientY": 300, "canvasLeft": 10, "canvasTop": 10},
    ]
    
    all_pass = True
    for i, tc in enumerate(test_cases):
        canvasX = tc["clientX"] - tc["canvasLeft"]
        canvasY = tc["clientY"] - tc["canvasTop"]
        
        worldX = canvasX / tc["scale"] + tc["viewX"]
        worldY = canvasY / tc["scale"] + tc["viewY"]
        
        render_screenX = (worldX - tc["viewX"]) * tc["scale"]
        render_screenY = (worldY - tc["viewY"]) * tc["scale"]
        
        match_canvasX = abs(render_screenX - canvasX) < 0.001
        match_canvasY = abs(render_screenY - canvasY) < 0.001
        
        status = "✓ PASS" if match_canvasX and match_canvasY else "✗ FAIL"
        if not match_canvasX or not match_canvasY:
            all_pass = False
        
        print(f"测试用例 {i+1}: {status}")
        print(f"  输入: view=({tc['viewX']},{tc['viewY']}), scale={tc['scale']}")
        print(f"        client=({tc['clientX']},{tc['clientY']}), canvasOffset=({tc['canvasLeft']},{tc['canvasTop']})")
        print(f"  计算: world=({worldX:.1f}, {worldY:.1f})")
        print(f"  反推: screen=({render_screenX:.1f}, {render_screenY:.1f})")
        print(f"  原始canvas坐标: ({canvasX}, {canvasY})")
        print(f"  一致性: X={'匹配' if match_canvasX else '不匹配'}, Y={'匹配' if match_canvasY else '不匹配'}")
        print()
    
    if all_pass:
        print("=== 所有测试通过！坐标转换完全一致 ===")
    else:
        print("=== 存在测试失败！请检查坐标转换逻辑 ===")
    
    return all_pass

def test_tile_coordinate():
    print("\n=== 瓦片坐标转换测试 ===\n")
    
    base_size = 4096
    tile_size = 256
    
    test_cases = [
        {"worldX": 500, "worldY": 520, "level": 0},
        {"worldX": 500, "worldY": 520, "level": 2},
        {"worldX": 2048, "worldY": 2048, "level": 5},
    ]
    
    for i, tc in enumerate(test_cases):
        levelScale = 2 ** tc["level"]
        tileWorldSize = tile_size * levelScale
        
        tileX = tc["worldX"] // tileWorldSize
        tileY = tc["worldY"] // tileWorldSize
        
        localX = (tc["worldX"] % tileWorldSize) // levelScale
        localY = (tc["worldY"] % tileWorldSize) // levelScale
        
        recovered_worldX = tileX * tileWorldSize + localX * levelScale
        recovered_worldY = tileY * tileWorldSize + localY * levelScale
        
        matchX = recovered_worldX <= tc["worldX"] < recovered_worldX + levelScale
        matchY = recovered_worldY <= tc["worldY"] < recovered_worldY + levelScale
        
        status = "✓ PASS" if matchX and matchY else "✗ FAIL"
        
        print(f"测试用例 {i+1}: {status}")
        print(f"  输入: world=({tc['worldX']},{tc['worldY']}), level={tc['level']}")
        print(f"  瓦片: tile=({tileX},{tileY}), local=({localX},{localY})")
        print(f"  瓦片世界大小: {tileWorldSize}, 层级缩放: {levelScale}")
        print(f"  反推世界坐标范围: X∈[{recovered_worldX}, {recovered_worldX + levelScale})")
        print(f"                        Y∈[{recovered_worldY}, {recovered_worldY + levelScale})")
        print()

if __name__ == "__main__":
    test_coordinate_transform()
    test_tile_coordinate()
