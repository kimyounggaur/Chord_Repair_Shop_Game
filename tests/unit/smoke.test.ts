import {expect,it} from 'vitest';
import orders from '../../src/content/orders.v1.json';
it('ships exactly the eight original orders',()=>expect(orders.map(o=>o.id)).toEqual(['CR01','CR02','CR03','CR04','CR05','CR06','CR07','CR08']));
